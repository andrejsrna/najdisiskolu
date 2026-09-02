// Centrálna konfigurácia webu — doména, názov a pomocné SEO funkcie.
// Doménu zmeň cez env NEXT_PUBLIC_SITE_URL (bez koncovej lomky).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.najdisiskolu.sk"
).replace(/\/+$/, "");

export const SITE_NAME = "Najdi si školu — Trnavský samosprávny kraj";

export const SITE_DESCRIPTION =
  "Katalóg stredných škôl Trnavského samosprávneho kraja. Nájdi si odbor, pozri si kritériá prijatia, dni otvorených dverí a voľné miesta.";

/** Z HTML stringu vyrobí čistý text a skráti na `max` znakov (bez roztrhnutia slova). */
export function stripHtml(html: string | null | undefined, max = 160): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}