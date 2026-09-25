// Jednorazový skript: nahrá fotky z priečinka "/root/0730 Skoly do brozury vyber"
// do S3 (skomprimované cez sharp) a vytvorí SchoolPhoto záznamy v DB.
// Titulka (isDetailCover + isListCover) sa nastaví zo súboru s "itulka" v názve.
// Spúšťanie: DATABASE_URL a S3_* musia byť v env. `npx tsx scripts/import-brozura-photos.ts`
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE_DIR = process.env.BROZURA_DIR ?? "/root/0730 Skoly do brozury vyber";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// --- S3 (SigV4) minimal client, duplicated from src/lib/s3.ts (script context, no server-only) ---
function requiredEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Chýba env: ${name}`);
  return v;
}
const cfg = {
  endpoint: requiredEnv("S3_ENDPOINT").replace(/\/$/, ""),
  publicUrl: requiredEnv("S3_PUBLIC_URL").replace(/\/$/, ""),
  bucket: requiredEnv("S3_BUCKET"),
  accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
  secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
  region: process.env.S3_REGION?.trim() || "us-east-1",
};

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest();
}
function signingKey(secret: string, date: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}
function encodedKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}
function amzDateParts(d: Date) {
  const compact = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: compact, date: compact.slice(0, 8) };
}

async function uploadBuffer(payload: Buffer, contentType: string, key: string): Promise<string> {
  const payloadHash = sha256Hex(payload);
  const { amzDate, date } = amzDateParts(new Date());
  const host = new URL(cfg.endpoint).host;
  const p = `/${cfg.bucket}/${encodedKey(key)}`;
  const canonicalHeaders =
    `content-type:${contentType}\n` + `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", p, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${date}/${cfg.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(Buffer.from(canonicalRequest, "utf8"))].join("\n");
  const signature = hmac(signingKey(cfg.secretAccessKey, date, cfg.region), stringToSign).toString("hex");

  const res = await fetch(`${cfg.endpoint}${p}`, {
    method: "PUT",
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: payload as BodyInit,
  });
  if (!res.ok) throw new Error(`Upload zlyhal (${res.status}): ${await res.text().catch(() => "")}`);
  return `${cfg.publicUrl}/${encodedKey(key)}`;
}

async function compressAndUpload(filePath: string, keyBase: string): Promise<string> {
  const input = fs.readFileSync(filePath);
  const img = sharp(input).rotate();
  const meta = await img.metadata();
  const ext = path.extname(filePath).toLowerCase();
  const hasAlpha = Boolean(meta.hasAlpha) && ext === ".png";
  const resized = img.resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true });
  if (hasAlpha) {
    const buf = await resized.webp({ quality: 82 }).toBuffer();
    return uploadBuffer(buf, "image/webp", `${keyBase}.webp`);
  }
  const buf = await resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return uploadBuffer(buf, "image/jpeg", `${keyBase}.jpg`);
}

// --- Priečinok -> slug mapovanie (35 škôl s "vyber" podpriečinkom) ---
// POZOR: "Gymnazium Galanta Slovenske Madarske" bol vyňatý zo všeobecnej slučky nižšie —
// priečinok v skutočnosti obsahuje fotky DVOCH škôl v jednej budove (SK aj HU gymnázium),
// rozdelené manuálne v EXTRA_JOBS (viď nižšie).
const FOLDER_TO_SLUG: Record<string, string> = {
  "Gymnázium Armina Vamberyho s VJM Dunajska Streda": "gymnazium-armina-vamberyho-s-vjm-vambery-armin-gimnazium",
  "SOS Podnikania v remeslach a sluzbach Senica": "stredna-odborna-skola-podnikania-v-remeslach-a-sluzbach",
  "SPS Elektrotechnicka Piestany": "stredna-priemyselna-skola-elektrotechnicka",
  "SOS Zdravotnicka Trnava": "stredna-zdravotnicka-skola-trnava",
  "SOS Lomonosovova Trnava": "stredna-odborna-skola-obchodu-a-sluzieb-trnava",
  "SOS Polnohospodarska Trnava": "stredna-odborna-skola-polnohospodarstva-a-sluzieb-na-vidieku",
  "SPS Dopravna Trnava": "stredna-priemyselna-skola-dopravna",
  "SOS Automobilova Trnava": "stredna-odborna-skola-automobilova",
  "Stredna zdravotnicka skola Lichardova Skalica": "stredna-zdravotnicka-skola",
  "SOS Technicka Nova Piestany": "stredna-odborna-skola-technicka-piestany",
  "SOS zahradnicka Rakovice": "stredna-odborna-skola-regionalneho-rozvoja-a-stredna-odborna-skola-zahradnicka",
  "SPS Stavebna Trnava": "stredna-priemyselna-skola-stavebna-dusana-samuela-jurkovica",
  "Gymnázium Pierra de Coubertina Piestany": "gymnazium-pierra-de-coubertina",
  "Obchodna akademia Senica": "obchodna-akademia",
  "SOS obchodu a sluzieb Galanta": "stredna-odborna-skola-obchodu-a-sluzieb",
  "Hotelova akademia L. Wintera Piestany": "hotelova-akademia-ludovita-wintera",
  "Obchodna akademia Trnava": "obchodna-akademia-trnava",
  "Stredna odborna skola Strojnicka Skalica": "stredna-odborna-skola-strojnicka",
  "Gymnazium Ivana Kupca Hlohovec": "gymnazium-ivana-kupca",
  "Gymnázium Františka Víťazoslava Sasinka Skalica": "gymnazium-frantiska-vitazoslava-sasinka",
  "Obchodna akademia Velky Meder": "obchodna-akademia-kereskedelmi-akademia",
  "SOS zdravotnicka Dunajska Streda": "stredna-zdravotnicka-skola-egeszsegugyi-kozepiskola",
  "Stredna skola Technicka Galanta": "stredna-odborna-skola-technicka-muszaki-szakkozepiskola-galanta",
  "Spojena skola Gyulu Szaboa Dunajska Streda": "spojena-skola-sos-informatiky-a-sluzieb-s-vjm-a-sos-stavebna-s-vjm",
  "Stredna odborna skola Holic": "spojena-skola-sos-technicka-jozefa-cabelku-a-sos-dopravy-a-sluzieb",
  "Gymnazium Vrbove": "gymnazium-jana-baltazara-magina",
  "SOS Elektrotechnicka Sibirska Trnava": "stredna-odborna-skola-elektrotechnicka-trnava",
  "Gymnazium Jana Holleho Trnava": "gymnazium-jana-holleho",
  "SOS Elektrotechnicka Gbely": "stredna-odborna-skola-elektrotechnicka",
  "Gymnazium a Stredna sportova skola Jozefa Herdu Trnava": "gymnazium-a-stredna-sportova-skola-jozefa-herdu",
  "Gymnazium Ladislava Dubravu Dunajska Streda": "gymnazium-ladislava-dubravu",
  "SOS Rozvoja vidieka s VJM Dunajska Streda": "stredna-odborna-skola-rozvoja-vidieka-s-vjm-a-stredna-sportova-skola-s-vjm",
  "Stredna odborna skola Technicka Dunajska Streda": "stredna-odborna-skola-technicka-muszaki-szakkozepiskola",
  "Stredna odborna skola Technicka Hlohovec": "stredna-odborna-skola-technicka",
};

function nfc(s: string) {
  return s.normalize("NFC");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const entries = fs.readdirSync(BASE_DIR);
  const slugToFolder = new Map<string, string>();
  for (const [folder, slug] of Object.entries(FOLDER_TO_SLUG)) {
    slugToFolder.set(slug, folder);
  }

  let totalUploaded = 0;
  for (const name of entries) {
    const full = path.join(BASE_DIR, name);
    if (!fs.statSync(full).isDirectory()) continue;
    const vyberDir = path.join(full, "vyber");
    if (!fs.existsSync(vyberDir)) continue;

    const slug = FOLDER_TO_SLUG[nfc(name)];
    if (!slug) {
      console.warn(`⚠️  Preskakujem (bez mapovania slug): ${name}`);
      continue;
    }

    const school = await prisma.school.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (!school) {
      console.warn(`⚠️  Škola v DB nenájdená pre slug ${slug} (${name})`);
      continue;
    }

    const files = fs
      .readdirSync(vyberDir)
      .filter((f) => /\.(jpe?g|png)$/i.test(f));
    if (files.length === 0) continue;

    const titulkaFiles = files.filter((f) => /itulka/i.test(f));
    const others = files.filter((f) => !titulkaFiles.includes(f));
    const ordered = [...titulkaFiles, ...others.sort()];

    const existingCount = await prisma.schoolPhoto.count({ where: { schoolId: school.id } });
    console.log(`\n📁 ${name} → ${school.name} (${slug}) — ${ordered.length} fotiek, existujúcich v DB: ${existingCount}`);

    if (dryRun) {
      for (const f of ordered) console.log(`   would upload: ${f}${titulkaFiles.includes(f) ? "  [TITULKA]" : ""}`);
      continue;
    }

    let sort = existingCount;
    for (let i = 0; i < ordered.length; i++) {
      const f = ordered[i];
      const filePath = path.join(vyberDir, f);
      const isTitulka = titulkaFiles.includes(f);
      try {
        const keyBase = `skoly/${school.id}/${crypto.randomUUID()}`;
        const url = await compressAndUpload(filePath, keyBase);
        sort += 1;
        if (isTitulka) {
          // zruš predošlú titulku (detail aj list), nastav novú
          await prisma.schoolPhoto.updateMany({
            where: { schoolId: school.id },
            data: { isDetailCover: false, isListCover: false },
          });
        }
        await prisma.schoolPhoto.create({
          data: {
            schoolId: school.id,
            url,
            alt: null,
            sort,
            isDetailCover: isTitulka,
            isListCover: isTitulka,
          },
        });
        totalUploaded += 1;
        console.log(`   ✅ ${f}${isTitulka ? " [TITULKA]" : ""} → ${url}`);
      } catch (err) {
        console.error(`   ❌ ${f}:`, (err as Error).message);
      }
    }
  }

  console.log(`\nHotovo. Nahraných fotiek: ${totalUploaded}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
