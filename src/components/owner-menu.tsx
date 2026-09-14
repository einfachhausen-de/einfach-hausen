"use client";

import { EHLogo } from "@/design-system";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CircleHelp, LogOut, UserRound, WalletCards } from "lucide-react";
import { CloseIcon, CrownIcon, HamburgerIcon, ArrowRightThin } from "@/components/icons";
import { logoutAction } from "@/app/actions";
import { matchesArea, ownerAccountItems, ownerAreas } from "./nav-config";

const ACCOUNT_ICONS = [UserRound, Bell, WalletCards, CircleHelp] as const;

function childActive(active: string, href: string): boolean {
  // Children that only differ by query string are marked by the page's own
  // tab bar, not here.
  if (href.includes("?")) return false;
  return active === href;
}

export function OwnerMobileMenu({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // The rendered state falls back to the area's own active state, so the toggle
  // has to flip what is on screen - not a second, different default.
  function toggleSection(href: string, currentlyExpanded: boolean) {
    setOpenSections((current) => ({ ...current, [href]: !currentlyExpanded }));
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <details
      className="mobile-menu ehn-menu"
      open={open}
      onToggle={(event) => setOpen((event.target as HTMLDetailsElement).open)}
    >
      <summary aria-label="Hauptmenü öffnen"><HamburgerIcon /><span>Menü</span></summary>
      {open ? <div className="menu-overlay open" onClick={() => setOpen(false)} aria-hidden="true" data-testid="owner-menu-overlay" /> : null}
      <aside
        className="side-menu ehn-drawer"
        aria-label="Hauptnavigation"
        onPointerDown={(event) => {
          const panel = event.currentTarget;
          const startX = event.clientX;
          let lastX = startX;
          const move = (moveEvent: PointerEvent) => {
            lastX = moveEvent.clientX;
            const delta = Math.max(0, lastX - startX);
            panel.style.transform = `translateX(${delta}px)`;
          };
          const up = () => {
            panel.removeEventListener("pointermove", move);
            panel.removeEventListener("pointerup", up);
            panel.style.transform = "";
            if (lastX - startX > 96) setOpen(false);
          };
          panel.addEventListener("pointermove", move);
          panel.addEventListener("pointerup", up);
        }}
      >
        <div className="sm-head">
          <EHLogo href="/app" />
          <button className="sm-close" onClick={() => setOpen(false)} aria-label="Menü schließen"><CloseIcon /></button>
        </div>

        <nav className="sm-nav ehn-acc">
          {ownerAreas.map((area) => {
            const Icon = area.icon;
            const areaActive = matchesArea(active, area);
            const expanded = openSections[area.href] ?? areaActive;
            if (area.children.length === 0) {
              return (
                <div key={area.href} className="ehn-acc-sec">
                  <Link
                    href={area.href}
                    className={`sm-item ehn-acc-head${areaActive ? " ehn-acc-active" : ""}`}
                    aria-current={areaActive ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="sm-icon"><Icon size={18} /></span>
                    <span className="sm-label">{area.label}</span>
                  </Link>
                </div>
              );
            }
            return (
              <div key={area.href} className={`ehn-acc-sec${expanded ? " ehn-acc-open" : ""}`}>
                <button type="button" className={`sm-item ehn-acc-head${areaActive ? " ehn-acc-active" : ""}`} aria-expanded={expanded} onClick={() => toggleSection(area.href, expanded)}>
                  <span className="sm-icon"><Icon size={18} /></span>
                  <span className="sm-label">{area.label}</span>
                  <span className="ehn-acc-chevron" aria-hidden="true"><ArrowRightThin /></span>
                </button>
                {expanded && <div className="ehn-acc-body">
                  {area.children.map((sub) => (
                    <button
                      key={sub.href}
                      type="button"
                      className={`ehn-acc-link${childActive(active, sub.href) ? " ehn-acc-active" : ""}`}
                      aria-current={childActive(active, sub.href) ? "page" : undefined}
                      onClick={() => go(sub.href)}
                    >
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>}
              </div>
            );
          })}
        </nav>

        <div className="sm-divider" />
        <nav className="sm-nav ehn-acc" aria-label="Konto">
          {ownerAccountItems.map((item, index) => {
            const AccountIcon = ACCOUNT_ICONS[index] ?? UserRound;
            return (
              <div key={item.href} className="ehn-acc-sec">
                <Link
                  href={item.href}
                  className={`sm-item ehn-acc-head${active === item.href ? " ehn-acc-active" : ""}`}
                  aria-current={active === item.href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="sm-icon"><AccountIcon size={18} /></span>
                  <span className="sm-label">{item.label}</span>
                </Link>
              </div>
            );
          })}
          <div className="ehn-acc-sec">
            <form action={logoutAction} className="ehn-acc-row">
              <button type="submit" className="sm-item ehn-acc-head" data-testid="owner-logout-menu" aria-label="Abmelden">
                <span className="sm-icon"><LogOut size={18} /></span>
                <span className="sm-label">Abmelden</span>
              </button>
            </form>
          </div>
        </nav>

        <div className="sm-divider" />
        <button type="button" className="sm-pro-card" onClick={() => go("/register-pro")}>
          <span className="sm-pro-icon"><CrownIcon /></span>
          <span className="sm-pro-text"><strong>Dienstleister werden</strong><span>Mehr Aufträge. Mehr Kunden.<br />Jetzt Partner werden!</span></span>
          <ArrowRightThin />
        </button>
        <form action={logoutAction}>
          <button type="submit" className="sm-logout" data-testid="owner-logout-drawer" aria-label="Abmelden"> <LogOut size={18} /> Abmelden</button>
        </form>
        <div className="sm-footer">Version 1.0.0 &nbsp;•&nbsp; <Link href="/app/more">Alle Bereiche</Link> &nbsp;•&nbsp; <Link href="/datenschutz">Datenschutz</Link> &nbsp;•&nbsp; <Link href="/impressum">Impressum</Link></div>
      </aside>
    </details>
  );
}
