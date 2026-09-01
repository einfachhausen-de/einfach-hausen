import fs from "node:fs";

const requiredFiles = [
  "src/components/marketing/premium/consumer-hero.tsx",
  "src/components/marketing/premium/visual-category-grid.tsx",
  "src/components/marketing/premium/story-steps.tsx",
  "src/components/marketing/premium/image-ui-composite.tsx",
  "src/components/marketing/premium/proof-chapter.tsx",
  "src/components/marketing/premium/partner-chapter.tsx",
  "src/components/marketing/premium/security-chapter.tsx",
  "src/components/marketing/premium/premium.module.css",
  "src/components/marketing/premium/assets.ts",
  "src/components/marketing/premium/types.ts",
];

const requiredAssets = [
  "public/brand/premium/homeowner-hero.webp",
  "public/brand/premium/category-heating.webp",
  "public/brand/premium/category-energy.webp",
  "public/brand/premium/category-roof.webp",
  "public/brand/premium/category-bath.webp",
  "public/brand/premium/category-renovation.webp",
  "public/brand/premium/category-garden.webp",
  "public/brand/premium/category-care.webp",
  "public/brand/premium/category-more.webp",
  "public/brand/premium/story-describe.webp",
  "public/brand/premium/story-professional.webp",
  "public/brand/premium/story-complete.webp",
  "public/brand/premium/house-record.webp",
  "public/brand/premium/partner-professional.webp",
  "public/brand/premium/security-home.webp",
];

const requiredNavHrefs = [
  "/so-funktionierts",
  "/leistungen",
  "/hausakte",
  "/partner",
  "/preise",
  "/eigenheimbesitzer",
  "/ueber-uns",
  "/hilfe",
  "/kontakt",
  "/sicherheit",
  "/login",
  "/register?role=homeowner",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/barrierefreiheit",
];

const requiredHomepageRoles = [
  "ConsumerHero",
  "VisualCategoryGrid",
  "StorySteps",
  "ImageUIComposite",
  "ProofChapter",
  "PartnerChapter",
  "SecurityChapter",
];

const errors = [];

for (const path of [...requiredFiles, ...requiredAssets]) {
  if (!fs.existsSync(path)) {
    errors.push(`missing ${path}`);
  }
}

const shell = fs.readFileSync("src/components/marketing/site-shell.tsx", "utf8");
for (const href of requiredNavHrefs) {
  if (!shell.includes(`"${href}"`) && !shell.includes(`'${href}'`)) {
    errors.push(`site shell missing navigation href ${href}`);
  }
}

const homepage = fs.readFileSync("src/app/page.tsx", "utf8");
for (const role of requiredHomepageRoles) {
  if (!homepage.includes(role)) {
    errors.push(`homepage missing ${role}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("premium redesign contract PASS");
