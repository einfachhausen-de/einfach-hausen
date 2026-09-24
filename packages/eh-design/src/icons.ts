import {BarChart3, CalendarClock, Camera, FileUp, Flame, PenLine, ReceiptText, ShieldCheck, Smartphone, Wifi, Zap} from 'lucide-react';
import type {ComponentType} from 'react';

/**
 * Ikonenschluessel des Designkerns — Daten bleiben serialisierbar, die
 * Seite nennt nur den Schluessel, der Kern kennt das Icon.
 */
export type EHIconKey = 'file-up'|'camera'|'pen'|'compare'|'bolt'|'flame'|'wifi'|'phone'|'shield'|'receipt'|'clock';
export const EH_ICONS: Record<EHIconKey, ComponentType<{size?: number}>> = {
  'file-up': FileUp, camera: Camera, pen: PenLine, compare: BarChart3,
  bolt: Zap, flame: Flame, wifi: Wifi, phone: Smartphone, shield: ShieldCheck,
  receipt: ReceiptText, clock: CalendarClock,
};
