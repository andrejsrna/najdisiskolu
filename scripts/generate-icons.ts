// Vygeneruje favicon/ikony a OG obrázok z emblému TTSK (src/lib/ttsk.ts).
// Spustenie: npx tsx scripts/generate-icons.ts
// Výstup: src/app/icon.svg, icon.png, apple-icon.png, opengraph-image.png
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { TTSK_EMBLEM } from "../src/lib/ttsk";

const ACID = "#F8FF00";

const emblem = TTSK_EMBLEM.replaceAll("var(--acid)", ACID);
// Vnútro emblému (bez vonkajšieho <svg>), aby sme ho vedeli vnoriť do OG layoutu.
const emblemInner = emblem.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

async function main() {
  // 1. SVG favicon (moderné prehliadače).
  writeFileSync("src/app/icon.svg", emblem, "utf-8");

  // 2. PNG ikony.
  const png = async (file: string, size: number) => {
    const buf = await sharp(Buffer.from(emblem)).resize(size, size).png().toBuffer();
    writeFileSync(file, buf);
    console.log(`✓ ${file} (${size}×${size})`);
  };
  await png("src/app/icon.png", 512);
  await png("src/app/apple-icon.png", 180);

  // 3. OG obrázok 1200×630.
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${ACID}"/>
  <rect width="1200" height="18" fill="#000000"/>
  <svg x="64" y="60" width="150" height="150" viewBox="74 74 135 135">${emblemInner}</svg>
  <text x="64" y="360" font-family="DejaVu Sans, Ubuntu, sans-serif" font-size="76" font-weight="bold" fill="#000000">Najdi si školu</text>
  <text x="64" y="430" font-family="DejaVu Sans, Ubuntu, sans-serif" font-size="34" fill="#000000">Katalóg stredných škôl Trnavského samosprávneho kraja</text>
  <rect x="0" y="612" width="1200" height="18" fill="#000000"/>
</svg>`;
  const ogBuf = await sharp(Buffer.from(og)).resize(1200, 630).png().toBuffer();
  writeFileSync("src/app/opengraph-image.png", ogBuf);
  console.log("✓ src/app/opengraph-image.png (1200×630)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});