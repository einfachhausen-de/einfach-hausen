"use client";

import * as React from "react";
import { Bell, BellOff, CircleHelp, ShieldCheck, Smartphone, Sparkles, UserRound, WalletCards } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { EHActions, EHButton, EHFormSection, EHList, EHText } from "@/design-system";
import { InstallAppCard } from "@/components/install-app-card";
import { AccountActions } from "./account-actions";
import { AiSettings } from "./ai-settings";
import { PwaSettingsStatus } from "./pwa-settings-status";
import styles from "./settings.module.css";

type SectionId = "account" | "notifications" | "plans" | "help" | "ai" | "app";

const NAV: { id: SectionId; name: string; icon: React.ReactNode }[] = [
  { id: "account", name: "Profil & Einstellungen", icon: <UserRound /> },
  { id: "notifications", name: "Benachrichtigungen", icon: <Bell /> },
  { id: "plans", name: "Mitgliedschaft & Pakete", icon: <WalletCards /> },
  { id: "help", name: "Hilfe & Kontakt", icon: <CircleHelp /> },
  { id: "ai", name: "KI-Assistent", icon: <Sparkles /> },
  { id: "app", name: "App & Offline", icon: <Smartphone /> },
];

export type SettingsSectionId = SectionId;

/** Gueltige Dialog-Bereiche; erster Eintrag ("account") ist der Default. */
export const SETTINGS_SECTION_IDS: readonly SectionId[] = ["account", "notifications", "plans", "help", "ai", "app"];

/** Unbekannte/leere Herkunft -> erster Bereich ("account"). */
export function parseSettingsSection(value: string | null | undefined): SectionId {
  return value === "notifications" || value === "plans" || value === "help" || value === "ai" || value === "app" ? value : "account";
}

// Owner-Einstellungen im Sidebar-Dialog-Muster (vgl. settings-dialog-Vorlage).
// Konto/Benachrichtigungen/KI/App-Texte sind 1:1 aus page.tsx übernommen;
// Mitgliedschaft & Pakete verlinkt die echten /app/plans- (und /preise-)Routen,
// Hilfe & Kontakt die echten /app/messages-, /app/hilfe- und /app/emergency-Routen.
// Keine eigene Logik, keine Mockdaten.
// Gesteuert (open/onOpenChange/showTrigger=false) als globales Overlay aus dem
// Rahmen; ungesteuert (Standard) mit eigenem Trigger, z.B. im Header von /app/settings.
export function OwnerSettingsDialog({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  initialSection = "account",
  showTrigger = true,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialSection?: SectionId;
  showTrigger?: boolean;
} = {}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [active, setActive] = React.useState<SectionId>(initialSection);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;
  const activeName = NAV.find((item) => item.id === active)?.name ?? "Einstellungen";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary">Einstellungen öffnen</Button>
        </DialogTrigger>
      )}
      <DialogContent className="overflow-hidden p-0 md:max-h-[85vh] lg:max-w-[1024px] xl:max-w-[1100px]">
        <DialogTitle className="sr-only">App-Einstellungen</DialogTitle>
        <DialogDescription className="sr-only">
          Profil und Einstellungen, Benachrichtigungen, Mitgliedschaft und Pakete, Hilfe und Kontakt, KI-Assistent sowie App-Installation und Offline-Status.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex md:min-w-[240px]">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {NAV.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          type="button"
                          isActive={item.id === active}
                          aria-current={item.id === active ? "true" : undefined}
                          onClick={() => setActive(item.id)}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[70vh] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/app/settings">Einstellungen</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              <nav aria-label="Einstellungsbereiche" className="flex flex-wrap gap-2 md:hidden">
                {NAV.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    size="sm"
                    variant={item.id === active ? "secondary" : "outline"}
                    aria-pressed={item.id === active}
                    onClick={() => setActive(item.id)}
                  >
                    {item.name}
                  </Button>
                ))}
              </nav>

              <section hidden={active !== "account"} aria-label="Profil & Einstellungen">
                <EHFormSection title="Profil & Einstellungen" description="Datenexport und Konto-Löschung nach DSGVO.">
                  <AccountActions />
                </EHFormSection>
              </section>

              <section hidden={active !== "notifications"} aria-label="Benachrichtigungen">
                <EHFormSection title="Benachrichtigungen" description="In-App-Updates sind aktiv; Browser-Push ist noch nicht freigeschaltet.">
                  <EHList label="Benachrichtigungen" items={[{ id: 'inapp', title: 'In-App-Benachrichtigungen öffnen', text: 'Auftragsstatus, Nachrichten und wichtige Plattform-Updates.', href: '/notifications' }]} />

                  <div className={styles.disabledSetting} role="group" aria-labelledby="push-setting-title" aria-describedby="push-setting-help">
                    <BellOff aria-hidden="true" />
                    <span>
                      <strong id="push-setting-title">Browser-Push</strong>
                      <small id="push-setting-help">Noch nicht verfügbar. Wir fragen deshalb keine Benachrichtigungsberechtigung an und zeigen keinen wirkungslosen Einschalter.</small>
                    </span>
                    <input type="checkbox" disabled aria-label="Browser-Push noch nicht verfügbar" />
                  </div>

                  <div className={styles.disabledSetting} role="group" aria-labelledby="checklist-setting-title" aria-describedby="checklist-setting-help">
                    <ShieldCheck aria-hidden="true" />
                    <span>
                      <strong id="checklist-setting-title">Checklisten-Erinnerungen per Push</strong>
                      <small id="checklist-setting-help">Noch nicht verfügbar. Erinnerungen erscheinen erst als Push-Option, wenn eine echte Zustellung eingerichtet ist.</small>
                    </span>
                    <input type="checkbox" disabled aria-label="Checklisten-Erinnerungen per Push noch nicht verfügbar" />
                  </div>
                </EHFormSection>
              </section>

              <section hidden={active !== "plans"} aria-label="Mitgliedschaft & Pakete">
                <EHFormSection title="Mitgliedschaft & Pakete" description="Aktueller Tarif und Pakete – Verwaltung auf der Tarif-Seite.">
                  <EHText muted>Du brauchst kein kostenpflichtiges Abo, um mit deinem Hauskonto zu beginnen. Dein aktueller Tarif und deine Paketbuchungen stehen auf der Tarif-Seite.</EHText>
                  <EHList label="Mitgliedschaft & Pakete" items={[{ id: 'plans', title: 'Tarif & Pakete öffnen', text: 'Aktueller Tarif, Mitgliedschaften und Einzelpakete.', href: '/app/plans' }]} />
                  <EHActions>
                    <EHButton href="/app/plans">Pakete verwalten</EHButton>
                    <EHButton href="/preise" variant="secondary">Öffentliche Tarifübersicht</EHButton>
                  </EHActions>
                </EHFormSection>
              </section>

              <section hidden={active !== "help"} aria-label="Hilfe & Kontakt">
                <EHFormSection title="Hilfe & Kontakt" description="Ansprechpartner, Hilfeseite und Notfallmeldung.">
                  <EHList label="Hilfe & Kontakt" items={[
                    { id: 'messages', title: 'Absprachen & Kontakt', text: 'Nachrichten an deine Ansprechpartner.', href: '/app/messages' },
                    { id: 'hilfe', title: 'Hilfeseite öffnen', text: 'Offene Vorgänge, Rechnungen und nächste Schritte.', href: '/app/hilfe' },
                    { id: 'emergency', title: 'Notfall melden', text: 'Dringende Schäden in der App melden – bei Lebensgefahr 112.', href: '/app/emergency' },
                  ]} />
                  <EHActions>
                    <EHButton href="/app/messages">Ansprechpartner öffnen</EHButton>
                    <EHButton href="/app/hilfe" variant="secondary">Hilfeseite öffnen</EHButton>
                  </EHActions>
                  <EHText muted>Bei Lebensgefahr, Brand oder Gasgeruch gilt allein der öffentliche Notruf 112.</EHText>
                </EHFormSection>
              </section>

              <section hidden={active !== "ai"} aria-label="KI-Assistent">
                <EHFormSection title="KI-Assistent" description="Kontingent, Bonus-Aktionen und eigener API-Key (BYOK).">
                  <AiSettings />
                </EHFormSection>
              </section>

              <section hidden={active !== "app"} aria-label="Installation & Offline">
                <EHFormSection title="App & Offline" description="Die App speichert keine privaten Seiten als Offline-Kopie.">
                  <InstallAppCard />
                  <PwaSettingsStatus />
                </EHFormSection>
              </section>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
