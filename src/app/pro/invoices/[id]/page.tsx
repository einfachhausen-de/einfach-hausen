import { EHButton, EHDocumentFrame, EHFormFeedback, EHSubmitButton, EHWorkflowForm } from "@/design-system";
import { PrintButton } from "@/components/print-button";
import { notFound } from 'next/navigation';
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
        <EHButton href={`/pro/jobs/${invoice.job_id}`} variant="secondary"><FileText size={16} />Zum Auftrag</EHButton>
        <PrintButton />
        {invoice.status === 'sent' && (
          <EHWorkflowForm action={cancelInvoiceAction.bind(null, invoice.id)}>
            <EHSubmitButton pendingLabel="Wird storniert…"><XCircle size={16} />Rechnung stornieren</EHSubmitButton>
          </EHWorkflowForm>
        )}
      </div>
      {sp.sent && <div className="print-hide"><EHFormFeedback kind="success">Rechnung wurde an den Eigentümer gesendet.</EHFormFeedback></div>}
      <InvoiceView invoice={invoice} />
    </main></EHDocumentFrame>
  );
}
