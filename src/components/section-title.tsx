import Link from 'next/link';

/** Sektionstitel mit optionalem „Alle anzeigen"-Link (zuvor in shell.tsx, AppShell ist tot). */
export function SectionTitle({ children, href }: {children:React.ReactNode; href?:string}) {
  return <div className="section-title"><strong>{children}</strong>{href && <Link href={href}>Alle anzeigen</Link>}</div>;
}
