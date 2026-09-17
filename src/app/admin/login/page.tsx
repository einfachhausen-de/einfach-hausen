import { EHAccessPage, EHButton, EHField, EHInput, EHFormFeedback } from '@/design-system';
import { adminLoginAction } from '@/app/actions';

export default async function AdminLogin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <EHAccessPage
      eyebrow="Administration"
      title="Plattform-Administration"
      text="Partnerprüfung und Problemfälle verwalten. Zugang nur für das Einfach-Hausen-Operationsteam."
      form={
        <form action={adminLoginAction} className="grid gap-4">
          {sp.error ? <EHFormFeedback kind="error">{sp.error}</EHFormFeedback> : null}
          <EHField id="password" label="Admin-Passwort" required>
            <EHInput type="password" name="password" id="password" required autoComplete="current-password" />
          </EHField>
          <EHButton type="submit">Admin anmelden</EHButton>
        </form>
      }
      help={[{ href: '/', label: 'Zurück zur App' }]}
      legal={<small>Zugriffe werden im Admin-Audit-Log protokolliert.</small>}
    />
  );
}
