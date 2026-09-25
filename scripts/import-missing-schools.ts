// Jednorazový skript: nahrá fotky pre školy s 0 fotkami z priečinka "/root/0730 Skoly do brozury vyber"
// + dorieši rozdelenie priečinka "Gymnazium Galanta Slovenske Madarske" medzi 2 školy
// (Gymnázium Janka Matúšku SK + Gymnázium Zoltána Kodálya HU, zdieľajú budovu).
// Spúšťanie: DATABASE_URL a S3_* musia byť v env. `npx tsx scripts/import-missing-schools.ts [--dry-run]`
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

type Job = { slug: string; files: { path: string; cover?: boolean }[] };

const B = BASE_DIR;

const jobs: Job[] = [
  {
    slug: "gymnazium-janka-matusku",
    files: [
      { path: `${B}/Gymnazium Galanta Slovenske Madarske/vyber/Titulka-DSC03155.jpg`, cover: true },
      { path: `${B}/Gymnazium Galanta Slovenske Madarske/vyber/DSC03172.jpg` },
      { path: `${B}/Gymnazium Galanta Slovenske Madarske/DSC03151.jpg` },
      { path: `${B}/Gymnazium Galanta Slovenske Madarske/DSC03153.jpg` },
    ],
  },
  {
    slug: "gymnazium-imre-madacha-s-vjm-madach-imre-gimnazium",
    files: [
      { path: `${B}/Gymnazium Imre Madacha  Samorin a Zakladna skola/titulka-DSC02693.jpg`, cover: true },
      { path: `${B}/Gymnazium Imre Madacha  Samorin a Zakladna skola/DSC02749.jpg` },
      { path: `${B}/Gymnazium Imre Madacha  Samorin a Zakladna skola/DSC02753.jpg` },
      { path: `${B}/Gymnazium Imre Madacha  Samorin a Zakladna skola/DSC02757.jpg` },
      { path: `${B}/Gymnazium Imre Madacha  Samorin a Zakladna skola/DSC02765.jpg` },
      { path: `${B}/Gymnazium Imre Madacha  Samorin a Zakladna skola/IMG03738.jpg` },
      { path: `${B}/Gymnazium Imre Madacha  Samorin a Zakladna skola/IMG03740.jpg` },
    ],
  },
  {
    slug: "gymnazium-ladislava-novomeskeho",
    files: [
      { path: `${B}/Gymnazium Ladislava Novomestkeho Senica/vyber/Titulka-3DS_7421.jpg`, cover: true },
      { path: `${B}/Gymnazium Ladislava Novomestkeho Senica/vyber/chmické pokusy_Deň otvorených dverí.jpg` },
      { path: `${B}/Gymnazium Ladislava Novomestkeho Senica/vyber/eTwinningový projekt 3D Printing for future_1.jpg` },
      { path: `${B}/Gymnazium Ladislava Novomestkeho Senica/vyber/eTwinningový projekt 3D Printing for future_2.jpg` },
      { path: `${B}/Gymnazium Ladislava Novomestkeho Senica/vyber/imatrikulačky_držíme spolu.JPG` },
      { path: `${B}/Gymnazium Ladislava Novomestkeho Senica/vyber/maturity.jpg` },
      { path: `${B}/Gymnazium Ladislava Novomestkeho Senica/vyber/odborné učebne.jpg` },
    ],
  },
  {
    slug: "gymnazium-vojtecha-mihalika",
    files: [
      { path: `${B}/Gymnazium Vojtecha Mihalika Sered/Titulka- 23428.jpg`, cover: true },
      { path: `${B}/Gymnazium Vojtecha Mihalika Sered/20250911_091835.jpg` },
      { path: `${B}/Gymnazium Vojtecha Mihalika Sered/3DS_9928.jpg` },
      { path: `${B}/Gymnazium Vojtecha Mihalika Sered/3DS_9930.jpg` },
      { path: `${B}/Gymnazium Vojtecha Mihalika Sered/pirfect.jpg` },
      { path: `${B}/Gymnazium Vojtecha Mihalika Sered/rozmaz.jpg` },
    ],
  },
  {
    slug: "obchodna-akademia-sered",
    files: [
      { path: `${B}/Obchodna akademia Sered/Titulka 3DS_9925.jpg`, cover: true },
      { path: `${B}/Obchodna akademia Sered/3DS_9925.jpg` },
      { path: `${B}/Obchodna akademia Sered/3DS_9930.jpg` },
      { path: `${B}/Obchodna akademia Sered/foto05.jpg` },
      { path: `${B}/Obchodna akademia Sered/foto07.jpg` },
      { path: `${B}/Obchodna akademia Sered/foto08.jpg` },
      { path: `${B}/Obchodna akademia Sered/foto10.jpg` },
    ],
  },
  {
    slug: "stredna-odborna-skola-chemicka-a-skola-umeleckeho-priemyslu",
    files: [
      { path: `${B}/Stredna odborna skola chemicka a Skola umeleckeho priemyslu Hlohovec/Titulka-Práca vo fotoateliéri.jpeg`, cover: true },
      { path: `${B}/Stredna odborna skola chemicka a Skola umeleckeho priemyslu Hlohovec/Chemické pokusy.JPG` },
      { path: `${B}/Stredna odborna skola chemicka a Skola umeleckeho priemyslu Hlohovec/Individuálna práca v kozmetickom salóne.JPG` },
      { path: `${B}/Stredna odborna skola chemicka a Skola umeleckeho priemyslu Hlohovec/Obhajoby maturitných prác.jpeg` },
      { path: `${B}/Stredna odborna skola chemicka a Skola umeleckeho priemyslu Hlohovec/Obhajoby ročníkových projektov.jpeg` },
      { path: `${B}/Stredna odborna skola chemicka a Skola umeleckeho priemyslu Hlohovec/Umelecká kresba v ateliéri.jpeg` },
    ],
  },
  {
    slug: "stredna-odborna-skola-obchodu-a-sluzieb-piestany",
    files: [
      { path: `${B}/Stredná odborná škola obchodu a služieb Mojmírova  Piestany/titulka-Duálne pracovisko (1).png`, cover: true },
      { path: `${B}/Stredná odborná škola obchodu a služieb Mojmírova  Piestany/3DS_1347 11.28.05.jpg` },
      { path: `${B}/Stredná odborná škola obchodu a služieb Mojmírova  Piestany/Reštaurácia Semafor (1).png` },
      { path: `${B}/Stredná odborná škola obchodu a služieb Mojmírova  Piestany/SOSOaS_PN_odbory.jpg` },
      { path: `${B}/Stredná odborná škola obchodu a služieb Mojmírova  Piestany/SOŠ OaS.jpg` },
    ],
  },
  {
    slug: "stredna-priemyselna-skola-technicka",
    files: [
      { path: `${B}/Stredna priemyselna skola Technicka Trnava/titulka-beanie prvakov 01.jpg`, cover: true },
      { path: `${B}/Stredna priemyselna skola Technicka Trnava/DSC08252.jpg` },
      { path: `${B}/Stredna priemyselna skola Technicka Trnava/DSC08255.jpg` },
      { path: `${B}/Stredna priemyselna skola Technicka Trnava/DSC08280.jpg` },
      { path: `${B}/Stredna priemyselna skola Technicka Trnava/DSC08305.jpg` },
      { path: `${B}/Stredna priemyselna skola Technicka Trnava/Den otvorenych dveri.jpg` },
      { path: `${B}/Stredna priemyselna skola Technicka Trnava/FabLab University kamion 01.jpg` },
    ],
  },
  {
    slug: "gymnazium-zoltana-kodalya-s-vjm-kodaly-zoltan-gimnazium",
    files: [
      { path: `${B}/Gymnazium Galanta Slovenske Madarske/vyber/Zbierka_Liga proti rakovine.JPEG` },
    ],
  },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let totalUploaded = 0;
  for (const job of jobs) {
    const school = await prisma.school.findUnique({ where: { slug: job.slug }, select: { id: true, name: true } });
    if (!school) {
      console.warn(`⚠️  Škola nenájdená pre slug ${job.slug}`);
      continue;
    }
    const existingCount = await prisma.schoolPhoto.count({ where: { schoolId: school.id } });
    console.log(`\n📁 ${school.name} (${job.slug}) — ${job.files.length} fotiek na nahratie, existujúcich v DB: ${existingCount}`);

    if (dryRun) {
      for (const f of job.files) {
        const exists = fs.existsSync(f.path);
        console.log(`   would upload: ${path.basename(f.path)}${f.cover ? " [COVER]" : ""} ${exists ? "" : "  ❌ MISSING FILE"}`);
      }
      continue;
    }

    let sort = existingCount;
    for (const f of job.files) {
      if (!fs.existsSync(f.path)) {
        console.error(`   ❌ chýba súbor: ${f.path}`);
        continue;
      }
      try {
        const keyBase = `skoly/${school.id}/${crypto.randomUUID()}`;
        const url = await compressAndUpload(f.path, keyBase);
        sort += 1;
        if (f.cover) {
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
            isDetailCover: Boolean(f.cover),
            isListCover: Boolean(f.cover),
          },
        });
        totalUploaded += 1;
        console.log(`   ✅ ${path.basename(f.path)}${f.cover ? " [COVER]" : ""} → ${url}`);
      } catch (err) {
        console.error(`   ❌ ${path.basename(f.path)}:`, (err as Error).message);
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
