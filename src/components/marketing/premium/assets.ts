import type { PremiumAsset } from "./types";

export const premiumAssets = {
  homeownerHero: {
    src: "/brand/premium/homeowner-hero.webp",
    alt: "Eigenheimbesitzer vor einem gepflegten Wohnhaus",
    focalPoint: "58% 50%",
  },
  categoryHeating: {
    src: "/brand/premium/category-heating.webp",
    alt: "Heizungs- und Thermostatdetail in einem Wohnhaus",
  },
  categoryEnergy: {
    src: "/brand/premium/category-energy.webp",
    alt: "Moderne Energie- und Elektroinstallation am Eigenheim",
  },
  categoryRoof: {
    src: "/brand/premium/category-roof.webp",
    alt: "Dach- und Gebäudehüllendetail eines Wohnhauses",
  },
  categoryBath: {
    src: "/brand/premium/category-bath.webp",
    alt: "Sanitärdetail in einem modernen Badezimmer",
  },
  categoryRenovation: {
    src: "/brand/premium/category-renovation.webp",
    alt: "Renovierungsarbeiten mit hochwertigen Materialien",
  },
  categoryGarden: {
    src: "/brand/premium/category-garden.webp",
    alt: "Gepflegter Garten und Außenbereich eines Eigenheims",
  },
  categoryCare: {
    src: "/brand/premium/category-care.webp",
    alt: "Pflege- und Reinigungsarbeit rund um ein Eigenheim",
  },
  categoryMore: {
    src: "/brand/premium/category-more.webp",
    alt: "Werkzeuge und Hausservice für weitere Arbeiten",
  },
  storyDescribe: {
    src: "/brand/premium/story-describe.webp",
    alt: "Eigentümer beschreibt ein Anliegen per Smartphone",
  },
  storyProfessional: {
    src: "/brand/premium/story-professional.webp",
    alt: "Fachkraft im Gespräch über eine Arbeit am Eigenheim",
  },
  storyComplete: {
    src: "/brand/premium/story-complete.webp",
    alt: "Erledigte Hausarbeit wird dokumentiert",
  },
  houseRecord: {
    src: "/brand/premium/house-record.webp",
    alt: "Eigenheim als Hintergrund für die digitale Hausakte",
  },
  partnerProfessional: {
    src: "/brand/premium/partner-professional.webp",
    alt: "Professionelle Fachkraft im Einsatz am Wohnhaus",
  },
  securityHome: {
    src: "/brand/premium/security-home.webp",
    alt: "Ruhige Wohnsituation als Symbol für Datenschutz und Sicherheit",
  },
} satisfies Record<string, PremiumAsset>;
