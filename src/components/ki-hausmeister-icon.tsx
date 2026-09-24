/**
 * KI-Hausmeister — das Hausmeister-Symbol der Kopfleiste: Kappe mit Haus-
 * Emblem, freundliches Gesicht, Latzhose, Funk. Nachgezeichnet als Inline-SVG
 * aus der Betreiber-Vorlage (Bild vom 23.09.), damit die Linien bei jeder
 * Groeße scharf bleiben und die Farbe ueber currentColor aus dem Knopf kommt
 * (Petrol im Ruhezustand, Weiss auf aktivem Untergrund — kein Filter-Trick).
 * Reine Zeichnung, keine eigenen Farben.
 */
export function KiHausmeisterIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor"
      strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {/* Kappe: Kuppe mit Haus-Emblem, Schirm als Linse; das Haus sitzt
          klar auf der Kuppe, der Kopf beginnt unter dem Schirm */}
      <path d="M13 24.5C13 9 43 9 43 24.5" />
      <path d="M10.5 25.5C16 30 40 30 45.5 25.5C40 31 16 31 10.5 25.5Z" />
      <path d="M23.5 16 28 11.5l4.5 4.5" />
      <path d="M25 16v5h6v-5" />
      {/* Kopf mit Laecheln (ohne Ohren — auf 19 px nur Rauschen) */}
      <path d="M17.5 32.5v2c0 6.5 4.2 10.5 10.5 10.5S38.5 41 38.5 34.5v-2" />
      <path d="M24 40.5q4 3 8 0" />
      {/* Schultern mit Laetzli */}
      <path d="M7 58.5c0-8.5 6.5-12 14-14l3.5 4.5h7l3.5-4.5c7.5 2 14 5.5 14 14" />
      <path d="M24.5 49v9.5h7V49" />
      {/* Funk: Stern, Punkt, Strich */}
      <g fill="currentColor" stroke="none">
        <circle cx="23.4" cy="36.5" r="2.1" />
        <circle cx="32.6" cy="36.5" r="2.1" />
        <circle cx="44.5" cy="5.5" r="1.6" />
        <path d="M51 8c1.3 4.3 2.2 5.2 6.5 6.5-4.3 1.3-5.2 2.2-6.5 6.5-1.3-4.3-2.2-5.2-6.5-6.5C48.8 13.2 49.7 12.3 51 8Z" />
      </g>
      <path d="m57 27 3 3" />
    </svg>
  );
}
