import { EHDocumentFrame } from "@/design-system";
import { PrintButton } from "@/components/print-button";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileText, XCircle } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { canAccessProviderJob } from '@/lib/provider';
import { invoiceWithItems } from '@/lib/invoices';
import { InvoiceView } from '@/components/invoice-view';
import { cancelInvoiceAction } from '@/app/actions';

export default async function ProviderInvoice({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireUser('provider');
  const { id } = await params;
  const sp = await searchParams;
  const invoice = invoiceWithItems(Number(id));
  if (!invoice) notFound();

  const ctx = canAccessProviderJob(user.id, invoice.job_id);
  if (!ctx || invoice.provider_id !== ctx.providerId) notFound();

  return (
    <EHDocumentFrame><main className="invoice-page pro-invoice-page">
      <div className="invoice-page-tools print-hide" aria-label="Rechnungsaktionen">
        <Link href={`/pro/jobs/${invoice.job_id}`} className="btn light"><FileText size={16} />Zum Auftrag</Link>
        <PrintButton />
        {invoice.status === 'sent' && (
          <form action={cancelInvoiceAction.bind(null, invoice.id)}>
            <button className="btn ghost pro-ghost"><XCircle size={16} />Rechnung stornieren</button>
          </form>
        )}
      </div>
      {sp.sent && <div className="alert success print-hide" role="status">Rechnung wurde an den Eigentümer gesendet.</div>}
      <InvoiceView invoice={invoice} />
    </main></EHDocumentFrame>
  );
}
