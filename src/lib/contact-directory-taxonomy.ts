// Ansprechpartner directory only. Do not use these IDs for provider matching or public services.
// Main labels + first Garten/Elektro examples: Gina request, 2026-09-13.
// Remaining subcategories: root-authored operational proposal, not an individual service verification.
export type ContactDirectoryCategory = {
  readonly id: string;
  readonly label: string;
  readonly subcategories: readonly { readonly id: string; readonly label: string }[];
};
export const CONTACT_DIRECTORY_CATEGORIES: readonly ContactDirectoryCategory[] = [
  {
    "id": "garten",
    "label": "Garten",
    "subcategories": [
      {
        "id": "garten-garten-und-landschaftsbauer",
        "label": "Garten- & Landschaftsbauer"
      },
      {
        "id": "garten-gaertner-gartenpflege",
        "label": "Gärtner / Gartenpflege"
      },
      {
        "id": "garten-baumpfleger-baumfaeller",
        "label": "Baumpfleger / Baumfäller"
      },
      {
        "id": "garten-bewaesserung",
        "label": "Bewässerung"
      },
      {
        "id": "garten-brunnenbauer",
        "label": "Brunnenbauer"
      }
    ]
  },
  {
    "id": "elektro",
    "label": "Elektro",
    "subcategories": [
      {
        "id": "elektro-elektriker",
        "label": "Elektriker"
      },
      {
        "id": "elektro-hausautomation",
        "label": "Hausautomation"
      },
      {
        "id": "elektro-energie-und-strom",
        "label": "Energie & Strom"
      },
      {
        "id": "elektro-notfall",
        "label": "Notfall"
      },
      {
        "id": "elektro-photovoltaik-und-speicher",
        "label": "Photovoltaik & Speicher"
      },
      {
        "id": "elektro-wallbox-und-ladeinfrastruktur",
        "label": "Wallbox & Ladeinfrastruktur"
      },
      {
        "id": "elektro-e-check-und-pruefung",
        "label": "E-Check & Prüfung"
      },
      {
        "id": "elektro-beleuchtung",
        "label": "Beleuchtung"
      }
    ]
  },
  {
    "id": "heizung",
    "label": "Heizung",
    "subcategories": [
      {
        "id": "heizung-heizungsbauer",
        "label": "Heizungsbauer"
      },
      {
        "id": "heizung-waermepumpen",
        "label": "Wärmepumpen"
      },
      {
        "id": "heizung-heizungswartung",
        "label": "Heizungswartung"
      },
      {
        "id": "heizung-heizkoerper-und-fussbodenheizung",
        "label": "Heizkörper & Fußbodenheizung"
      },
      {
        "id": "heizung-schornsteinfeger",
        "label": "Schornsteinfeger"
      },
      {
        "id": "heizung-solarthermie",
        "label": "Solarthermie"
      },
      {
        "id": "heizung-heizungsnotdienst",
        "label": "Heizungsnotdienst"
      }
    ]
  },
  {
    "id": "wasser-sanitaer",
    "label": "Wasser & Sanitär",
    "subcategories": [
      {
        "id": "wasser-sanitaer-sanitaerinstallateur",
        "label": "Sanitärinstallateur"
      },
      {
        "id": "wasser-sanitaer-badbau-und-badsanierung",
        "label": "Badbau & Badsanierung"
      },
      {
        "id": "wasser-sanitaer-rohrreinigung-und-kanalservice",
        "label": "Rohrreinigung & Kanalservice"
      },
      {
        "id": "wasser-sanitaer-leckortung",
        "label": "Leckortung"
      },
      {
        "id": "wasser-sanitaer-wasseraufbereitung",
        "label": "Wasseraufbereitung"
      },
      {
        "id": "wasser-sanitaer-rohrbruch-und-notdienst",
        "label": "Rohrbruch & Notdienst"
      }
    ]
  },
  {
    "id": "dach",
    "label": "Dach",
    "subcategories": [
      {
        "id": "dach-dachdecker",
        "label": "Dachdecker"
      },
      {
        "id": "dach-dachabdichtung-und-flachdach",
        "label": "Dachabdichtung & Flachdach"
      },
      {
        "id": "dach-dachrinnen-und-klempnerarbeiten",
        "label": "Dachrinnen & Klempnerarbeiten"
      },
      {
        "id": "dach-dachfenster",
        "label": "Dachfenster"
      },
      {
        "id": "dach-dachdaemmung",
        "label": "Dachdämmung"
      },
      {
        "id": "dach-zimmerer",
        "label": "Zimmerer"
      }
    ]
  },
  {
    "id": "fenster-tueren",
    "label": "Fenster & Türen",
    "subcategories": [
      {
        "id": "fenster-tueren-fensterbauer",
        "label": "Fensterbauer"
      },
      {
        "id": "fenster-tueren-tuerenbauer",
        "label": "Türenbauer"
      },
      {
        "id": "fenster-tueren-rolllaeden-und-sonnenschutz",
        "label": "Rollläden & Sonnenschutz"
      },
      {
        "id": "fenster-tueren-verglasung-und-glasreparatur",
        "label": "Verglasung & Glasreparatur"
      },
      {
        "id": "fenster-tueren-insektenschutz",
        "label": "Insektenschutz"
      },
      {
        "id": "fenster-tueren-reparatur-und-wartung",
        "label": "Reparatur & Wartung"
      }
    ]
  },
  {
    "id": "renovieren",
    "label": "Renovieren",
    "subcategories": [
      {
        "id": "renovieren-maler-und-tapezierer",
        "label": "Maler & Tapezierer"
      },
      {
        "id": "renovieren-bodenleger",
        "label": "Bodenleger"
      },
      {
        "id": "renovieren-fliesenleger",
        "label": "Fliesenleger"
      },
      {
        "id": "renovieren-trockenbauer",
        "label": "Trockenbauer"
      },
      {
        "id": "renovieren-stuckateur-und-verputzer",
        "label": "Stuckateur & Verputzer"
      },
      {
        "id": "renovieren-schreiner-und-tischler",
        "label": "Schreiner & Tischler"
      }
    ]
  },
  {
    "id": "bauen-sanieren",
    "label": "Bauen & Sanieren",
    "subcategories": [
      {
        "id": "bauen-sanieren-bauunternehmen-und-maurer",
        "label": "Bauunternehmen & Maurer"
      },
      {
        "id": "bauen-sanieren-altbausanierung",
        "label": "Altbausanierung"
      },
      {
        "id": "bauen-sanieren-fassadenbau-und-sanierung",
        "label": "Fassadenbau & -sanierung"
      },
      {
        "id": "bauen-sanieren-daemmung-und-energetische-sanierung",
        "label": "Dämmung & energetische Sanierung"
      },
      {
        "id": "bauen-sanieren-beton-und-bautenschutz",
        "label": "Beton & Bautenschutz"
      },
      {
        "id": "bauen-sanieren-abdichtung-und-feuchtesanierung",
        "label": "Abdichtung & Feuchtesanierung"
      },
      {
        "id": "bauen-sanieren-abbrucharbeiten",
        "label": "Abbrucharbeiten"
      }
    ]
  },
  {
    "id": "reinigung",
    "label": "Reinigung",
    "subcategories": [
      {
        "id": "reinigung-gebaeudereinigung",
        "label": "Gebäudereinigung"
      },
      {
        "id": "reinigung-fenster-und-glasreinigung",
        "label": "Fenster- & Glasreinigung"
      },
      {
        "id": "reinigung-grund-und-bauendreinigung",
        "label": "Grund- & Bauendreinigung"
      },
      {
        "id": "reinigung-dach-und-fassadenreinigung",
        "label": "Dach- & Fassadenreinigung"
      },
      {
        "id": "reinigung-teppich-und-polsterreinigung",
        "label": "Teppich- & Polsterreinigung"
      },
      {
        "id": "reinigung-terrassen-und-steinreinigung",
        "label": "Terrassen- & Steinreinigung"
      },
      {
        "id": "reinigung-spezialreinigung",
        "label": "Spezialreinigung"
      }
    ]
  },
  {
    "id": "reparaturen-montage",
    "label": "Reparaturen & Montage",
    "subcategories": [
      {
        "id": "reparaturen-montage-hausmeister-und-allrounder",
        "label": "Hausmeister & Allrounder"
      },
      {
        "id": "reparaturen-montage-moebelmontage",
        "label": "Möbelmontage"
      },
      {
        "id": "reparaturen-montage-kuechenmontage",
        "label": "Küchenmontage"
      },
      {
        "id": "reparaturen-montage-haushaltsgeraete-reparatur",
        "label": "Haushaltsgeräte-Reparatur"
      },
      {
        "id": "reparaturen-montage-tueren-und-fenster-reparatur",
        "label": "Türen- & Fenster-Reparatur"
      },
      {
        "id": "reparaturen-montage-montage-und-kleinreparaturen",
        "label": "Montage & Kleinreparaturen"
      }
    ]
  },
  {
    "id": "klima-lueftung",
    "label": "Klima & Lüftung",
    "subcategories": [
      {
        "id": "klima-lueftung-klimaanlagen",
        "label": "Klimaanlagen"
      },
      {
        "id": "klima-lueftung-lueftungsanlagen",
        "label": "Lüftungsanlagen"
      },
      {
        "id": "klima-lueftung-klima-und-lueftungswartung",
        "label": "Klima- & Lüftungswartung"
      },
      {
        "id": "klima-lueftung-luftqualitaet-und-entfeuchtung",
        "label": "Luftqualität & Entfeuchtung"
      },
      {
        "id": "klima-lueftung-kaelteanlagen",
        "label": "Kälteanlagen"
      },
      {
        "id": "klima-lueftung-lueftungsreinigung",
        "label": "Lüftungsreinigung"
      }
    ]
  },
  {
    "id": "sicherheit",
    "label": "Sicherheit",
    "subcategories": [
      {
        "id": "sicherheit-schluesseldienst",
        "label": "Schlüsseldienst"
      },
      {
        "id": "sicherheit-schliessanlagen",
        "label": "Schließanlagen"
      },
      {
        "id": "sicherheit-alarm-und-videoueberwachung",
        "label": "Alarm- & Videoüberwachung"
      },
      {
        "id": "sicherheit-einbruchschutz",
        "label": "Einbruchschutz"
      },
      {
        "id": "sicherheit-brandschutz-und-rauchmelder",
        "label": "Brandschutz & Rauchmelder"
      },
      {
        "id": "sicherheit-sicherheitsberatung",
        "label": "Sicherheitsberatung"
      }
    ]
  },
  {
    "id": "entruempeln-umzug",
    "label": "Entrümpeln & Umzug",
    "subcategories": [
      {
        "id": "entruempeln-umzug-entruempelung",
        "label": "Entrümpelung"
      },
      {
        "id": "entruempeln-umzug-haushaltsaufloesung",
        "label": "Haushaltsauflösung"
      },
      {
        "id": "entruempeln-umzug-umzugsunternehmen",
        "label": "Umzugsunternehmen"
      },
      {
        "id": "entruempeln-umzug-moebeltransport",
        "label": "Möbeltransport"
      },
      {
        "id": "entruempeln-umzug-entsorgung-und-recycling",
        "label": "Entsorgung & Recycling"
      },
      {
        "id": "entruempeln-umzug-einlagerung",
        "label": "Einlagerung"
      }
    ]
  },
  {
    "id": "aussenanlagen",
    "label": "Außenanlagen",
    "subcategories": [
      {
        "id": "aussenanlagen-pflasterbau-und-wegebau",
        "label": "Pflasterbau & Wegebau"
      },
      {
        "id": "aussenanlagen-terrassenbau",
        "label": "Terrassenbau"
      },
      {
        "id": "aussenanlagen-zaun-und-torbau",
        "label": "Zaun- & Torbau"
      },
      {
        "id": "aussenanlagen-garagen-und-carports",
        "label": "Garagen & Carports"
      },
      {
        "id": "aussenanlagen-erdarbeiten-und-entwaesserung",
        "label": "Erdarbeiten & Entwässerung"
      },
      {
        "id": "aussenanlagen-aussentreppen-und-stuetzmauern",
        "label": "Außentreppen & Stützmauern"
      },
      {
        "id": "aussenanlagen-markisen-und-pergolen",
        "label": "Markisen & Pergolen"
      }
    ]
  },
  {
    "id": "pool-garten",
    "label": "Pool & Garten",
    "subcategories": [
      {
        "id": "pool-garten-poolbau",
        "label": "Poolbau"
      },
      {
        "id": "pool-garten-poolpflege-und-wartung",
        "label": "Poolpflege & -wartung"
      },
      {
        "id": "pool-garten-pooltechnik-und-wasseraufbereitung",
        "label": "Pooltechnik & Wasseraufbereitung"
      },
      {
        "id": "pool-garten-whirlpool-und-swimspa",
        "label": "Whirlpool & Swimspa"
      },
      {
        "id": "pool-garten-gartenteiche-und-naturpools",
        "label": "Gartenteiche & Naturpools"
      },
      {
        "id": "pool-garten-gartenhaeuser-und-saunen",
        "label": "Gartenhäuser & Saunen"
      }
    ]
  },
  {
    "id": "gutachter-planung",
    "label": "Gutachter & Planung",
    "subcategories": [
      {
        "id": "gutachter-planung-bausachverstaendige",
        "label": "Bausachverständige"
      },
      {
        "id": "gutachter-planung-architekten",
        "label": "Architekten"
      },
      {
        "id": "gutachter-planung-bauingenieure-und-statiker",
        "label": "Bauingenieure & Statiker"
      },
      {
        "id": "gutachter-planung-energieberater",
        "label": "Energieberater"
      },
      {
        "id": "gutachter-planung-vermessung",
        "label": "Vermessung"
      },
      {
        "id": "gutachter-planung-schadengutachter",
        "label": "Schadengutachter"
      },
      {
        "id": "gutachter-planung-baubegleitung-und-bauabnahme",
        "label": "Baubegleitung & Bauabnahme"
      },
      {
        "id": "gutachter-planung-schadstoff-und-schimmelgutachten",
        "label": "Schadstoff- & Schimmelgutachten"
      }
    ]
  },
  {
    "id": "immobilien",
    "label": "Immobilien",
    "subcategories": [
      {
        "id": "immobilien-immobilienmakler",
        "label": "Immobilienmakler"
      },
      {
        "id": "immobilien-immobilienbewertung",
        "label": "Immobilienbewertung"
      },
      {
        "id": "immobilien-haus-und-weg-verwaltung",
        "label": "Haus- & WEG-Verwaltung"
      },
      {
        "id": "immobilien-vermietungsservice",
        "label": "Vermietungsservice"
      },
      {
        "id": "immobilien-finanzierungsberatung",
        "label": "Finanzierungsberatung"
      },
      {
        "id": "immobilien-notar",
        "label": "Notar"
      },
      {
        "id": "immobilien-immobilienkaufberatung",
        "label": "Immobilienkaufberatung"
      }
    ]
  }
];

export function contactDirectoryCategory(id: string | undefined) {
  return CONTACT_DIRECTORY_CATEGORIES.find(category => category.id === id);
}
export function contactDirectorySubcategory(id: string | undefined) {
  for (const main of CONTACT_DIRECTORY_CATEGORIES) {
    const sub = main.subcategories.find(item => item.id === id);
    if (sub) return { ...sub, mainId: main.id, mainLabel: main.label };
  }
  return undefined;
}
