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

for (const path of requiredFiles) {
  if (!fs.existsSync(path)) {
    errors.push(`missing ${path}`);
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
