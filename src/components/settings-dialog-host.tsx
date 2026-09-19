"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OwnerSettingsDialog, parseSettingsSection } from "@/app/app/settings/owner-settings-dialog";

export const SETTINGS_DIALOG_EVENT = "eh:open-settings";
export const SETTINGS_DIALOG_PARAM = "einstellungen";

/** Globaler Trigger: öffnet den Einstellungs-Dialog als Overlay über der aktuellen Seite. */
export function openSettingsDialog(section?: string) {
  window.dispatchEvent(new CustomEvent(SETTINGS_DIALOG_EVENT, { detail: { section } }));
}

function SettingsDialogHostInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eventSection, setEventSection] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string }>).detail;
      setEventSection(detail?.section ?? "account");
    };
    window.addEventListener(SETTINGS_DIALOG_EVENT, onOpen);
    return () => window.removeEventListener(SETTINGS_DIALOG_EVENT, onOpen);
  }, []);

  // Links auf /app/settings (z.B. Profil-Tabs, Hausmeister) öffnen den Dialog
  // als Overlay über der aktuellen Seite statt zu navigieren.
  React.useEffect(() => {
    if (pathname === "/app/settings") return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('[data-slot="dialog-content"]')) return;
      const anchor = target?.closest?.('a[href="/app/settings"], a[href^="/app/settings?"]');
      if (!anchor) return;
      if (anchor.getAttribute("target") === "_blank" || anchor.hasAttribute("download")) return;
      event.preventDefault();
      const href = anchor.getAttribute("href") ?? "/app/settings";
      const query = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
      setEventSection(parseSettingsSection(new URLSearchParams(query).get(SETTINGS_DIALOG_PARAM)));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  const hasParam = searchParams.has(SETTINGS_DIALOG_PARAM);
  // Die Fallback-Route rendert denselben Inhalt als Seite und braucht kein Overlay.
  if (pathname === "/app/settings") return null;

  const paramSection = hasParam ? parseSettingsSection(searchParams.get(SETTINGS_DIALOG_PARAM)) : null;
  const section = paramSection ?? (eventSection ? parseSettingsSection(eventSection) : null);
  return (
    <OwnerSettingsDialog
      key={section ?? "account"}
      open={section !== null}
      onOpenChange={(next) => {
        if (next) return;
        setEventSection(null);
        if (hasParam) {
          const nextParams = new URLSearchParams(searchParams.toString());
          nextParams.delete(SETTINGS_DIALOG_PARAM);
          const query = nextParams.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }
      }}
      initialSection={section ?? "account"}
      showTrigger={false}
    />
  );
}

export function SettingsDialogHost() {
  return (
    <React.Suspense fallback={null}>
      <SettingsDialogHostInner />
    </React.Suspense>
  );
}
