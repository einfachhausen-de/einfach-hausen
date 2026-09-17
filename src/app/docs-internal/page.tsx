import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { EHScope, EHSection, EHHeading, EHText, EHList } from "@/design-system";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Entwickler-Docs (intern)",
  robots: { index: false, follow: false },
};

export default async function DocsInternalIndex() {
  await requireAdmin();
  const docsDir = path.join(process.cwd(), "docs");
  let files: string[] = [];
  try {
    files = fs
      .readdirSync(docsDir)
      .filter((f) => f.toLowerCase().endsWith(".md"))
      .sort((a, b) => a.localeCompare(b, "de"));
  } catch {
    files = [];
  }
  return (
    <EHScope>
      <EHSection compact>
        <EHHeading as="h1" scale="page">Entwickler-Docs</EHHeading>
        <EHText muted>
          Interne Markdown-Dokumente aus <code>docs/*.md</code>. Nur f&uuml;r Admins.
        </EHText>
        {files.length === 0 ? (
          <EHText>Keine Dokumente gefunden.</EHText>
        ) : (
          <EHList
            label="Entwickler-Dokumente"
            items={files.map((f) => ({
              id: f,
              title: f,
              href: `/docs-internal/${encodeURIComponent(f.replace(/\.md$/i, ""))}`,
            }))}
          />
        )}
      </EHSection>
    </EHScope>
  );
}
