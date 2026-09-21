import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHDocumentBrowser, previewKind, type EHBrowserDocument, type EHDocumentFolder } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { loadDocumentCatalog } from '@/lib/document-catalog';
import { euroExact } from '@/lib/format';
import { invoiceStatusLabel } from '@/lib/invoices';
import { ownerInstant } from '@/lib/owner-format';

const documentKinds: Record<string, { folder: EHDocumentFolder; label: string }> = {
  invoice: { folder: 'invoice', label: 'Rechnung' },
  offer: { folder: 'offer', label: 'Angebot' },
  report: { folder: 'report', label: 'Bericht' },
  warranty: { folder: 'warranty', label: 'Garantie' },
  other: { folder: 'other', label: 'Dokument' },
};

function dateFields(value: string | null | undefined) {
  if (!value) return { date: '', dateLabel: 'Datum nicht hinterlegt' };
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const instant = dateOnly ? new Date(value + 'T12:00:00Z') : ownerInstant(value);
  if (!instant || !Number.isFinite(instant.getTime())) return { date: '', dateLabel: 'Datum nicht hinterlegt' };
  return {
    date: instant.toISOString(),
    dateLabel: new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' }).format(instant),
  };
}

export default async function Documents() {
  const user = await requireUser('homeowner');
  const { uploaded, invoices, payments, history } = loadDocumentCatalog(db, user.id);
  const openInvoices = invoices.filter(invoice => invoice.status === 'sent');
  const openTotal = openInvoices.reduce((sum, invoice) => sum + invoice.total_gross, 0);

  // Only display data and authenticated URLs cross into the client.
  // Private storage paths supply a format hint and never leave the server.
  const documents: EHBrowserDocument[] = [
    ...invoices.map((invoice): EHBrowserDocument => ({
      id: `i-${invoice.id}`, folder: 'invoice', title: `Rechnung ${invoice.invoice_number}`,
      issuer: invoice.business_name, context: invoice.title,
      ...dateFields(invoice.issue_date || invoice.created_at),
      amount: euroExact(invoice.total_gross), status: invoiceStatusLabel(invoice.status),
      statusTone: invoice.status === 'paid' ? 'success' : invoice.status === 'sent' ? 'warning' : 'neutral',
      href: `/app/invoices/${invoice.id}`, preview: 'none', kindLabel: 'Rechnung',
    })),
    ...uploaded.map((document): EHBrowserDocument => {
      const kind = documentKinds[document.kind] || documentKinds.other;
      return {
        id: `d-${document.id}`, folder: kind.folder, title: document.document_title || kind.label,
        issuer: document.business_name || '', context: document.job_title,
        ...dateFields(document.created_at), href: `/api/documents/${document.id}`,
        preview: previewKind(document.path), kindLabel: kind.label,
      };
    }),
    ...payments.map((payment): EHBrowserDocument => ({
      id: `p-${payment.id}`, folder: 'receipt', title: `Zahlungsbeleg · ${payment.title}`,
      issuer: payment.business_name, context: payment.title,
      ...dateFields(payment.paid_at || payment.created_at), amount: euroExact(payment.amount),
      status: 'Bezahlt', statusTone: 'success', href: `/app/documents/${payment.job_id}/receipt`,
      preview: 'none', kindLabel: 'Zahlungsbeleg',
    })),
    ...history.map((document): EHBrowserDocument => ({
      id: `h-${document.id}`, folder: 'other', title: document.title || 'Dokument aus der Haus-Historie',
      issuer: document.company_name || '', context: document.context,
      ...dateFields(document.performed_at), href: `/api/house-history-documents/${document.id}`,
      preview: previewKind(document.path), kindLabel: 'Haus-Historie',
    })),
  ];

  return <WerkbankRahmen role="homeowner" active="/app/documents">
    <EHDocumentBrowser documents={documents} openInvoiceLabel={openInvoices.length ? `${euroExact(openTotal)} offen` : undefined} />
  </WerkbankRahmen>;
}
