import { EHDocumentFrame } from "@/design-system";
import { PrintButton } from "@/components/print-button";
import { notFound } from 'next/navigation';
import { CreditCard,FileText } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { invoiceWithItems } from '@/lib/invoices';
import { InvoiceView } from '@/components/invoice-view';
import { EHActions, EHButton, EHErrorState, EHText } from '@/design-system';
import { createInvoiceCheckoutAction } from '@/app/actions';

export default async function CustomerInvoice({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const {id}=await params; const sp=await searchParams; const invoice=invoiceWithItems(Number(id));
  if(!invoice||invoice.homeowner_id!==user.id)notFound();
  return <EHDocumentFrame><main><EHActions><EHButton href="/app/documents" variant="secondary"><FileText size={16}/>Dokumente</EHButton><PrintButton />{invoice.status==='sent'&&<form action={createInvoiceCheckoutAction.bind(null,invoice.id)}><EHButton type="submit"><CreditCard size={16}/>Rechnung bezahlen</EHButton></form>}</EHActions>{sp.error&&<EHErrorState text={sp.error} />}{sp.payment==='cancelled'&&<EHErrorState text="Zahlung wurde abgebrochen. Es wurde nichts belastet." />}{sp.payment==='unavailable'&&<EHErrorState text="Onlinezahlung ist gerade nicht verfügbar. Die Rechnung bleibt unverändert; stimme die Zahlung direkt mit dem Partner ab oder versuche es später erneut." />}<InvoiceView invoice={invoice}/><EHText muted>Zum Speichern als PDF die Druckfunktion deines Browsers bzw. Geräts verwenden.</EHText></main></EHDocumentFrame>;
}
