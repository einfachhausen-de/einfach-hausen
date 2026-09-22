import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, consumeRateLimitAttempt } from "@/lib/security/rate-limit";
import { db } from "@/lib/db";
import { logSecurityEvent } from "@/lib/security/audit";

// GDPR data export (EH T-0203): a machine-readable JSON download of the
// requester's own personal data. Secrets (password hash) are never included.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = `u:${user.id}`;
  if (!checkRateLimit("account_mutation", key).allowed) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte später erneut." }, { status: 429 });
  }
  consumeRateLimitAttempt("account_mutation", key);

  const id = user.id;
  const one = (sql: string) => db.prepare(sql).get(id) ?? null;
  const all = (sql: string) => db.prepare(sql).all(id);
  const allBoth = (sql: string) => db.prepare(sql).all(id, id);
  const payload = {
    exported_at: new Date().toISOString(),
    account: one("SELECT id,email,role,first_name,last_name,phone,created_at FROM users WHERE id=?"),
    homeowner_profile: one("SELECT postcode,address FROM homeowner_profiles WHERE user_id=?"),
    provider_profile: one("SELECT business_name,trades,postcode,radius_km,description,street_address FROM provider_profiles WHERE user_id=?"),
    provider_preferences: one("SELECT * FROM provider_preferences WHERE provider_id=?"),
    properties: all(`SELECT p.* FROM properties p JOIN property_ownerships o ON o.property_id=p.id WHERE o.homeowner_id=?`),
    house_assets: all("SELECT * FROM house_assets WHERE homeowner_id=?"),
    maintenance_tasks: all("SELECT * FROM maintenance_tasks WHERE homeowner_id=?"),
    house_history_entries: all("SELECT * FROM house_history_entries WHERE homeowner_id=?"),
    house_contracts: all("SELECT id,kind,provider,tariff,contract_number,cost_amount,cost_interval,started_at,term_months,renewal_months,cancellation_days,cancellation_deadline,notice,document_title,status,created_at,updated_at FROM house_contracts WHERE homeowner_id=?"),
    house_documents: all("SELECT id,property_id,title,kind,created_at,updated_at FROM house_documents WHERE homeowner_id=?"),
    document_intelligence: all("SELECT source_type,source_id,original_name,mime_type,status,document_kind,relevant_date,search_text,confidence,error_code,created_at,updated_at FROM document_intelligence_jobs WHERE homeowner_id=?"),
    owner_ai_insight_state: all("SELECT insight_key,fingerprint,notified_at FROM owner_ai_insight_state WHERE user_id=?"),
    jobs_as_homeowner: all("SELECT id,title,description,category,status,created_at FROM jobs WHERE homeowner_id=?"),
    quotes_as_provider: all("SELECT job_id,amount,status,message,created_at FROM quotes WHERE provider_id=?"),
    subscriptions: all("SELECT plan_slug,status,current_period_end,created_at FROM subscriptions WHERE homeowner_id=?"),
    partner_subscriptions: all("SELECT plan_slug,status,current_period_end,created_at FROM partner_subscriptions WHERE provider_id=?"),
    invoices: allBoth("SELECT invoice_number,issue_date,service_date,currency,seller_name,buyer_name,subtotal_net,tax_amount,total_gross,status,created_at FROM invoices WHERE provider_id=? OR homeowner_id=?"),
    appointments: allBoth(`SELECT a.start_at,a.status,a.created_at,j.title job_title FROM appointments a JOIN jobs j ON j.id=a.job_id WHERE a.homeowner_id=? OR a.provider_id=?`),
    reviews_written: all("SELECT job_id,rating,comment,hidden,created_at FROM reviews WHERE homeowner_id=?"),
    messages: all("SELECT m.job_id,m.body,m.created_at FROM messages m WHERE m.sender_id=?"),
    reviews_about_me_as_provider: all("SELECT job_id,rating,comment,hidden,created_at FROM reviews WHERE provider_id=?"),
    package_orders: all("SELECT package_slug,status,created_at FROM package_orders WHERE homeowner_id=?"),
    house_transfers_initiated: all("SELECT property_id,status,created_at FROM house_transfers WHERE homeowner_id=?"),
    claims: allBoth(`SELECT c.id,c.kind,c.description,c.status,c.created_at FROM claims c WHERE c.homeowner_id=? OR c.provider_id=?`),
    // Nur In-App-Zeilen: die E-Mail-Auslieferung eines Ereignisses ist eine
    // identische zweite Outbox-Zeile (channel='email') und enthaelt keine
    // zusaetzlichen Daten, wuerde den Export aber doppelt auffuehren.
    notifications: all("SELECT kind,title,body,href,created_at FROM notifications WHERE user_id=? AND channel='in_app'"),
    // T-0143: partner role completeness - team memberships where the user is a
    // member or the owning provider, plus house transfer receive history.
    provider_memberships: all(`SELECT pm.provider_id,pm.job_title,pm.can_manage_jobs,pm.active,pm.created_at,
        p.business_name
      FROM provider_members pm LEFT JOIN provider_profiles p ON p.user_id=pm.provider_id
      WHERE pm.user_id=?`),
    provider_teams_owned: all(`SELECT pm.user_id AS member_user_id,pm.job_title,pm.can_manage_jobs,pm.active,pm.created_at
      FROM provider_members pm WHERE pm.provider_id=?`),
    house_transfers_received: all(`SELECT property_id,status,created_at,accepted_at FROM house_transfers WHERE accepted_by_user_id=?`),
    contact_directory_entries: all("SELECT id,contact_user_id,display_name,company,phone,email,legacy_category,revision,created_at,updated_at FROM homeowner_contact_entries WHERE homeowner_id=?"),
    contact_directory_assignments: all(`SELECT links.entry_id,links.subcategory_id,subs.title AS subcategory_label,mains.slug AS main_category_id,mains.title AS main_category_label,links.created_at
      FROM homeowner_contact_subcategories links
      JOIN contact_directory_subcategories subs ON subs.slug=links.subcategory_id
      JOIN contact_directory_mains mains ON mains.slug=subs.main_slug
      WHERE links.homeowner_id=?`),
  };
  // T-0127: private-file manifest lists media the user owns (job media, house
  // history documents) so the export is self-describing; the archive is a
  // single JSON document (reproducible: same DB state -> same bytes modulo the
  // exported_at timestamp), bounded by the rate limit above.
  const privateFiles = db
    .prepare(
      `SELECT jp.id, jp.path, jp.created_at, 'job_media' AS kind FROM job_photos jp
         JOIN jobs j ON j.id = jp.job_id WHERE j.homeowner_id = ?
       UNION ALL
       SELECT hhd.id, hhd.path, hhd.created_at, 'house_history_document' AS kind FROM house_history_documents hhd
         JOIN house_history_entries hhe ON hhe.id = hhd.entry_id WHERE hhe.homeowner_id = ?
       UNION ALL
       SELECT hc.id, hc.document_path, hc.created_at, 'house_contract_document' AS kind FROM house_contracts hc
         WHERE hc.homeowner_id = ? AND hc.document_path IS NOT NULL
       UNION ALL
       SELECT hd.id, hd.path, hd.created_at, 'house_document' AS kind FROM house_documents hd
         WHERE hd.homeowner_id = ?`,
    )
    .all(id, id, id, id) as Array<{ id: number; path: string; created_at: string; kind: string }>;

  const exportPayload = {
    ...payload,
    private_files_manifest: {
      count: privateFiles.length,
      note: "Pfade sind serverintern (data/private/...); Dateiinhalte werden aus Datenschutzgruenden nicht in den Export kopiert.",
      files: privateFiles,
    },
  };

  // T-0143 idempotency: identical repeated requests inside the dedupe window
  // return the same logical export (ledger marks them duplicate, response is
  // still fully generated and identical in scope). The ledger keeps every
  // request row so the user has a transparent request history.
  const dedupeWindow = new Date(Date.now() - 60_000).toISOString();
  const duplicate = db.prepare(
    "SELECT id FROM data_requests WHERE user_id=? AND kind='export' AND status='completed' AND created_at>=?",
  ).get(id, dedupeWindow) as { id: number } | undefined;

  db.prepare("INSERT INTO data_requests(user_id,kind,status,detail,completed_at) VALUES(?, 'export', 'completed', ?, CURRENT_TIMESTAMP)")
    .run(id, `scope=${Object.keys(payload).length} sectionen; format=json; private_manifest=${privateFiles.length}${duplicate ? ' (duplicate within 60s window)' : ''}`);
  logSecurityEvent("account_export", `user:${id}${duplicate ? ' duplicate' : ''}`);
  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="einfach-hausen-export-${id}-${Date.now()}.json"`,
      "cache-control": "no-store",
    },
  });
}
