export type PremiumTone = "cream" | "mint" | "mist" | "white" | "petrol";

export type PremiumAsset = {
  src: string;
  alt: string;
  decorative?: boolean;
  focalPoint?: `${number}% ${number}%`;
};

export type ProofFact = {
  label: string;
  detail: string;
};

export type CategoryCard = {
  title: string;
  text: string;
  href: string;
  asset: PremiumAsset;
  tone: PremiumTone;
};

export type StoryStep = {
  index: "01" | "02" | "03";
  title: string;
  text: string;
  asset: PremiumAsset;
};
