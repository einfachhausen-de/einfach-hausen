import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { markPaymentFailed, markPaymentPaid, stripePaymentsConfigured } from '@/lib/payments';
import { structuredLog } from '@/lib/observability';
import { createNotification } from '@/lib/notifications';
import { claimWebhookEvent,completeWebhookEvent,releaseWebhookEvent } from '@/lib/security/webhooks';

function subscriptionId(value:Stripe.Checkout.Session['subscription']){
  if(typeof value==='string')return value;
  return value?.id||null;
}

function subscriptionPeriodEnd(subscription:Stripe.Subscription){
  const values=subscription.items.data.map(item=>item.current_period_end).filter(value=>Number.isFinite(value)&&value>0);
  return values.length?new Date(Math.max(...values)*1000).toISOString():null;
}

async function reconcilePartnerMembership(stripe:Stripe,session:Stripe.Checkout.Session){
  const id=subscriptionId(session.subscription);
  const providerId=Number(session.metadata?.providerId);
  const planSlug=session.metadata?.planSlug?.trim();
  if(!id||!Number.isSafeInteger(providerId)||providerId<=0||!planSlug)return;

  const subscription=await stripe.subscriptions.retrieve(id);
  const periodEnd=subscriptionPeriodEnd(subscription);
  const trialEnd=subscription.trial_end?new Date(subscription.trial_end*1000).toISOString():null;
  const status=subscription.status==='trialing'?'trialing':'active';
  const current=db.prepare('SELECT plan_slug,status,stripe_subscription_id FROM partner_subscriptions WHERE provider_id=?').get(providerId) as {
    plan_slug:string; status:string; stripe_subscription_id:string|null;
  }|undefined;
  const changed=!current||current.plan_slug!==planSlug||current.status!==status||current.stripe_subscription_id!==subscription.id;

  db.prepare(`INSERT INTO partner_subscriptions(provider_id,plan_slug,status,stripe_subscription_id,current_period_end,trial_end,updated_at)
    VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(provider_id) DO UPDATE SET
      plan_slug=excluded.plan_slug,status=excluded.status,stripe_subscription_id=excluded.stripe_subscription_id,
      current_period_end=excluded.current_period_end,trial_end=excluded.trial_end,updated_at=CURRENT_TIMESTAMP`).run(providerId,planSlug,status,subscription.id,periodEnd,trialEnd);

  if(current?.stripe_subscription_id&&current.stripe_subscription_id!==subscription.id){
    try{await stripe.subscriptions.cancel(current.stripe_subscription_id);}catch{}
  }
  if(changed){
    const managers=db.prepare('SELECT user_id FROM provider_members WHERE provider_id=? AND active=1 AND can_manage_jobs=1').all(providerId) as Array<{user_id:number}>;
    for(const manager of managers)createNotification(manager.user_id,'Partner-Tarif aktiv',`Partner-Tarif ${planSlug.toUpperCase()} ist aktiv.`,'/pro/plans','membership');
  }
}

function reconcileSubscriptionState(event:Stripe.Event){
  const subscription=event.data.object as Stripe.Subscription;
  const periodEnd=subscriptionPeriodEnd(subscription);
  // Hauseigentuemer haben keine Mitgliedschaft mehr, deshalb wird hier keine
  // Owner-Subscription mehr fortgeschrieben. Bestandsdaten in `subscriptions`
  // bleiben unangetastet.
  const partnerStatus=event.type==='customer.subscription.deleted'
    ?'cancelled'
    :(subscription.status==='trialing'?'trialing':subscription.status==='active'?'active':subscription.status==='past_due'?'past_due':'cancelled');
  db.prepare('UPDATE partner_subscriptions SET status=?,current_period_end=?,trial_end=?,updated_at=CURRENT_TIMESTAMP WHERE stripe_subscription_id=?')
    .run(partnerStatus,periodEnd,subscription.trial_end?new Date(subscription.trial_end*1000).toISOString():null,subscription.id);
}

function reconcileRefund(charge:Stripe.Charge){
  const paymentIntentId=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;
  if(!paymentIntentId||paymentIntentId.length>255)return;
  db.prepare(`UPDATE payments SET status='refunded',updated_at=CURRENT_TIMESTAMP WHERE stripe_session_id=?`).run(paymentIntentId);
}

export async function POST(req:NextRequest){
  if(!stripePaymentsConfigured())return new NextResponse('Stripe webhook not configured',{status:503});
  const secretKey=process.env.STRIPE_SECRET_KEY;
  const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!secretKey||!webhookSecret)return new NextResponse('Stripe webhook not configured',{status:503});

  const stripe=new Stripe(secretKey);
  const body=await req.text();
  const signature=req.headers.get('stripe-signature');
  if(!signature)return new NextResponse('Missing signature',{status:400});

  let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(body,signature,webhookSecret);}
  catch{return new NextResponse('Invalid signature',{status:400});}

  if(!claimWebhookEvent('stripe',event.id))return NextResponse.json({received:true,duplicate:true});
  structuredLog.info('external_service','stripe webhook accepted',{correlation_id:req.headers.get('x-correlation-id')??undefined,event_id:event.id});

  try{
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
      const session=event.data.object as Stripe.Checkout.Session;
      const kind=session.metadata?.kind;
      // 'membership' (Eigentuemer) und 'package' entfallen: Eigentuemer nutzen
      // einfachhausen kostenlos. 'partner_membership' bleibt der einzige Abo-Typ.
      if(kind==='partner_membership')await reconcilePartnerMembership(stripe,session);

      // Payment attempts (including invoice_payment) reconcile independently of
      // metadata kind. Non-payment Checkout sessions simply have no matching row.
      if(session.payment_status==='paid')markPaymentPaid(session.id);
      structuredLog.info('payment','stripe payment reconciled',{event_id:event.id});
    }

    if(event.type==='checkout.session.async_payment_failed'||event.type==='checkout.session.expired'){
      const session=event.data.object as Stripe.Checkout.Session;
      markPaymentFailed(session.id);
      structuredLog.warn('payment','stripe payment failed/expired',{event_id:event.id});
    }

    if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
      reconcileSubscriptionState(event);
    }

    if(event.type==='charge.refunded'){
      const charge=event.data.object as Stripe.Charge;
      reconcileRefund(charge);
      structuredLog.info('payment','stripe charge refund reconciled',{event_id:event.id});
    }

    if(event.type==='account.updated'){
      const account=event.data.object as Stripe.Account;
      const ready=Boolean(account.details_submitted&&account.charges_enabled&&account.payouts_enabled);
      db.prepare('UPDATE provider_profiles SET stripe_onboarded=? WHERE stripe_account_id=?').run(ready?1:0,account.id);
    }

    completeWebhookEvent('stripe',event.id);
    return NextResponse.json({received:true});
  }catch{
    releaseWebhookEvent('stripe',event.id);
    return new NextResponse('Webhook processing failed',{status:500});
  }
}
