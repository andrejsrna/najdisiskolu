// Import 44 škôl z HTML prototypu „Vyber si strednú" do databázy.
// Spúšťanie: npm run import:html  (alebo npx tsx scripts/import-from-html.ts)
//
// Čo robí:
//  1. Z HTML vytiahne `const D` (pole škôl) a `const UPL` (mapa uplatnenia).
//  2. Vymaže existujúce školy (kaskáda — odbory/projekty/DOD/downloads/badge).
//  3. Naimportuje 44 škôl s vnorenými odbormi, projektmi a tagmi.
//  4. Vypíše report + zoznam všetkých kľúčov, ktoré sa v dátach vyskytli.
//
// Pozn.: `dod` (deň otvorených dverí) sa NEIMPORTUJE — v prototype je len
// cyklený placeholder podľa indexu, školy si reálny dátum+čas doplnia cez admin.
import "dotenv/config";
import fs from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Completion } from "../src/generated/prisma/enums";

const HTML_PATH =
  process.env.IMPORT_HTML ??
  "/root/.hermes/attachments/Vyber si strednú - Trnavský samosprávny kraj.html";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/* ——— extrakcia JS literálov ——— */

function extractLiteral(source: string, decl: string, nextDecl: string): string {
  const start = source.indexOf(decl);
  if (start < 0) throw new Error(`Nenašiel som deklaráciu: ${decl}`);
  const endMarker = source.indexOf(nextDecl, start);
  if (endMarker < 0) throw new Error(`Nenašiel som koniec pre: ${decl}`);
  const end = source.lastIndexOf("]", endMarker);
  if (end < 0) throw new Error(`Nenašiel som uzatváraciu ] pre: ${decl}`);
  return source.slice(start + decl.length, end + 1);
}

/* ——— pomocné mapovanie ——— */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const bool = (v: unknown): boolean => v === 1 || v === true || v === "1";
const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v : null;
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const COMPLETION: Record<string, Completion> = {
  mat: Completion.MATURITA,
  vl: Completion.VYUCNY_LIST,
  mv: Completion.MATURITA_A_VYUCNY_LIST,
  zav: Completion.ZAVERECNA_SKUSKA,
};

/* ——— hlavný beh ——— */

async function main() {
  const html = fs.readFileSync(HTML_PATH, "utf8");

  const dJs = extractLiteral(html, "const D = ", "const SCHOOLS");
  const uplJs = extractLiteral(html, "const UPL = ", "function upl(");

  type SchoolRaw = Record<string, unknown> & {
    n: string;
    m: string;
    o: string;
    z?: string[];
    j?: string[];
    od?: [string, string, number | string, string][];
    proj?: [string, string][];
  };

  const D = new Function(`return ${dJs}`)() as SchoolRaw[];
  const UPL = new Function(`return ${uplJs}`)() as [string, string][];

  console.log(`Z HTML načítaných ${D.length} škôl, ${UPL.length} pravidiel uplatnenia.`);

  // upl(name) — presne ako v prototype (najkonkrétnejšie prvé)
  const upl = (name: string): string => {
    const s = name.toLowerCase();
    for (const [k, v] of UPL) if (s.includes(k)) return v;
    return "";
  };

  // zoznam všetkých kľúčov pre report
  const seenKeys = new Set<string>();
  for (const s of D) for (const k of Object.keys(s)) seenKeys.add(k);
  console.log("Kľúče v dátach:", [...seenKeys].sort().join(", "));

  // unikátne tagy / jazyky / ukončenia pre sanity-check
  const zCodes = new Set<string>(); D.forEach((s) => (s.z || []).forEach((c) => zCodes.add(c)));
  const jCodes = new Set<string>(); D.forEach((s) => (s.j || []).forEach((c) => jCodes.add(c)));
  const ukony = new Set<string>(); D.forEach((s) => (s.od || []).forEach((o) => ukony.add(String(o[3]))));
  console.log(`Tagy (z): ${[...zCodes].join(", ")}`);
  console.log(`Jazyky (j): ${[...jCodes].join(", ")}`);
  console.log(`Ukončenia (od[3]): ${[...ukony].join(", ")}`);

  // 0. Uisti sa, že všetky tagy existujú (keby bol v dátach kód mimo ZAM)
  const existingTags = new Set((await prisma.tag.findMany({ select: { code: true } })).map((t) => t.code));
  for (const code of zCodes) {
    if (!existingTags.has(code)) {
      await prisma.tag.create({ data: { code, label: code } });
      console.log(`  + doplnený chýbajúci tag: ${code}`);
    }
  }

  // 1. Vymaž existujúce školy (kaskáda) — začínam čisto
  const deleted = await prisma.school.deleteMany();
  console.log(`Vymazaných ${deleted.count} existujúcich škôl.`);

  // 2. Import
  const usedSlugs = new Set<string>();
  let importovanych = 0;
  let celkovoOdborov = 0;
  let celkovoProjektov = 0;

  for (const r of D) {
    // unikátny slug
    let slug = slugify(r.n);
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(r.m)}`;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${slug}/${n++}`;
    usedSlugs.add(slug);

    const odbory = (r.od || []).map((o) => {
      const employment = upl(o[1]) || undefined;
      return {
        code: String(o[0]),
        name: String(o[1]),
        length: Number(o[2]),
        completion: COMPLETION[String(o[3])] ?? Completion.MATURITA,
        employment,
      };
    });
    const projekty = (r.proj || []).map((p, i) => ({
      title: String(p[0]),
      description: String(p[1] ?? ""),
      sort: i,
    }));

    await prisma.school.create({
      data: {
        name: r.n,
        slug,
        city: r.m,
        district: r.o,
        languages: strArr(r.j),
        foreignLanguages: strArr(r.jaz),
        hasInternat: bool(r.i),
        internatInfo: str(r.intTxt),
        hasCanteen: bool(r.s),
        hasDual: bool(r.d),
        dualCompanies: strArr(r.dfirmy),
        hasNadstavba: bool(r.nad),
        hasNativeSpeaker: bool(r.nat),
        accessibility: str(r.bez),
        erasmus: str(r.er),
        website: str(r.w),
        email: str(r.e),
        phone: str(r.t),
        facebook: str(r.f),
        instagram: str(r.ig),
        // INEKO: nová štruktúra (rank+of) — import už nebeží, konverzia je v migrácii
        totalStudents: str(r.ziakovReal),
        intro: str(r.p),
        practice: str(r.prac),
        whyUs: strArr(r.top),
        modernization: str(r.mod),
        plans: str(r.plan),
        support: str(r.podp),
        achievements: str(r.usp),
        partners: str(r.part),
        graduates: str(r.absolventi),
        other: str(r.ost),
        otherTop: str(r.ostTop),
        clubs: strArr(r.kr),
        sports: strArr(r.sport),
        canteenOptions: strArr(r.buf),
        supportTeam: strArr(r.tim),
        certificates: strArr(r.cert),
        isComplete: true,
        isPublished: true,
        tags: { connect: (r.z || []).map((code) => ({ code })) },
        odbory: { create: odbory },
        projects: { create: projekty },
      },
    });

    importovanych++;
    celkovoOdborov += odbory.length;
    celkovoProjektov += projekty.length;
  }

  // 3. Naviaž demo používateľa školy na reálne gymnázium (ak existuje)
  const demoUser = await prisma.user.findUnique({ where: { email: "skola@demo.sk" } });
  if (demoUser) {
    const gym = await prisma.school.findFirst({
      where: { name: "Gymnázium Ladislava Dúbravu" },
    });
    if (gym) {
      await prisma.user.update({ where: { id: demoUser.id }, data: { schoolId: gym.id } });
      console.log(`  + skola@demo.sk naviazaný na: ${gym.name}`);
    }
  }

  const readiness = {
    skoly: await prisma.school.count(),
    odbory: await prisma.odbor.count(),
    projekty: await prisma.project.count(),
  };
  console.log("\n✅ Import hotový:", readiness);
  console.log(`   importovaných: ${importovanych}, odborov: ${celkovoOdborov}, projektov: ${celkovoProjektov}`);
}

main()
  .catch((e) => {
    console.error("❌ Import zlyhal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
