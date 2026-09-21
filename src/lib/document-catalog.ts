type CatalogDatabase = { prepare(sql: string): { all(...params: number[]): unknown[] } };
export type UploadedDocument = { id: number; kind: string; path: string; created_at: string; document_title: string; job_title: string; business_name: string | null };
export type CatalogInvoice = { id: number; invoice_number: string; total_gross: number; issue_date: string; created_at: string; status: string; title: string; business_name: string };
export type CatalogPayment = { id: number; job_id: number; amount: number; paid_at: string; created_at: string; title: string; business_name: string };
export type HistoryDocument = { id: number; title: string; path: string; context: string; company_name: string | null; performed_at: string };

/** Authorization remains in the route; every query also scopes its rows. */
export function loadDocumentCatalog(db: CatalogDatabase, homeownerId: number): {
  uploaded: UploadedDocument[]; invoices: CatalogInvoice[]; payments: CatalogPayment[]; history: HistoryDocument[];
} {
  const uploaded = db.prepare(`SELECT d.id,d.kind,d.path,d.created_at,d.title document_title,j.title job_title,p.business_name
    FROM documents d JOIN jobs j ON j.id=d.job_id LEFT JOIN provider_profiles p ON p.user_id=d.provider_id
    WHERE j.homeowner_id=? ORDER BY d.created_at DESC`).all(homeownerId) as UploadedDocument[];
  const invoices = db.prepare(`SELECT i.id,i.invoice_number,i.total_gross,i.issue_date,i.created_at,i.status,j.title,p.business_name
    FROM invoices i JOIN jobs j ON j.id=i.job_id JOIN provider_profiles p ON p.user_id=i.provider_id
    WHERE i.homeowner_id=? AND j.homeowner_id=? ORDER BY i.created_at DESC`).all(homeownerId, homeownerId) as CatalogInvoice[];
  // The existing receipt route renders the latest paid row for a job. Older
  // rows must not advertise amounts that the linked receipt does not contain.
  const payments = db.prepare(`SELECT pay.id,pay.job_id,pay.amount,pay.paid_at,pay.created_at,j.title,p.business_name
    FROM payments pay JOIN jobs j ON j.id=pay.job_id JOIN provider_profiles p ON p.user_id=pay.provider_id
    WHERE pay.homeowner_id=? AND j.homeowner_id=? AND pay.status='paid'
      AND pay.id=(SELECT MAX(latest.id) FROM payments latest WHERE latest.job_id=pay.job_id AND latest.homeowner_id=pay.homeowner_id AND latest.status='paid')
    ORDER BY pay.paid_at DESC`).all(homeownerId, homeownerId) as CatalogPayment[];
  // This is where the existing "Dokument hinzufügen" action stores uploads.
  // Match the protected download endpoint's active-ownership rule (EXISTS also
  // avoids duplicate files if historical ownership rows overlap).
  const history = db.prepare(`SELECT d.id,d.title,d.path,h.title context,h.company_name,h.performed_at
    FROM house_history_documents d JOIN house_history_entries h ON h.id=d.entry_id
    WHERE EXISTS (SELECT 1 FROM property_ownerships o WHERE o.property_id=h.property_id AND o.homeowner_id=? AND o.active=1)
    ORDER BY h.performed_at DESC,d.id DESC`).all(homeownerId) as HistoryDocument[];
  return { uploaded, invoices, payments, history };
}
