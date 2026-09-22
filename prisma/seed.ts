// Seed — vytvorí kompletný obsah (44 škôl + odbory + projekty + tagy + priestory +
// veľtrhy + recenzie + posty + settings + používateľov) z prisma/seed-data.json.
// Idempotentné: ak už DB obsahuje školy, seed sa preskočí.
// Migruje aj legacy SUPER posty → model Review (vždy, idempotentne).
// Opätovný export dát: npx tsx scripts/export-seed.ts
import "dotenv/config";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role, type Completion } from "../src/generated/prisma/enums";
import { QA } from "../src/lib/qa-data";
import { DEMO_NEWS } from "../src/lib/demo-news";
import { VELTRHY_SECTIONS_DEFAULT, VELTRHY_SECTIONS_KEY } from "../src/lib/veltrhy-content";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type SeedSchool = {
  name: string; slug: string; city: string; district: string;
  languages: string[]; foreignLanguages: string[];
  hasInternat: boolean; internatInfo: string | null;
  hasCanteen: boolean; hasDual: boolean; dualCompanies: string[];
  hasNadstavba: boolean; hasNativeSpeaker: boolean;
  accessibility: string | null; erasmus: string | null;
  websites: string[]; email: string | null; phone: string | null;
  facebook: string | null; instagram: string | null;
  address: string | null; mapUrl: string | null;
  inekoKrajRank: number | null; inekoKrajOf: string | null; inekoSkRank: number | null; inekoSkOf: string | null;
  internatType: string | null; erasmusCountries: string[]; hasMaturita: boolean; hasVl: boolean;
  totalStudents: string | null; photoUrl: string | null; logoUrl: string | null;
  intro: string | null; practice: string | null; modernization: string | null;
  plans: string | null; support: string | null; achievements: string | null;
  partners: string | null; graduates: string | null; other: string | null; otherTop: string | null;
  whyUs: string[]; clubs: string[]; sports: string[]; canteenOptions: string[];
  supportTeam: string[]; certificates: string[];
  isComplete: boolean; isPublished: boolean;
  tagCodes: string[];
  odbory: { code: string; name: string; length: number; completion: string; accepts: number | null; appliedLastYear: number | null; places: number | null; employment: string | null; sort: number }[];
  projects: { title: string; description: string; sort: number }[];
  dods: { date: string | null; time: string | null; note: string | null }[];
  downloads: { title: string; fileUrl: string; fileName: string | null; sort: number }[];
  badges: { label: string; kind: string; note: string | null }[];
};

type SeedReview = {
  name: string; age: string | null; quote: string; photoUrl: string | null;
  published: boolean; sort: number; schoolSlug: string | null;
};

type SeedData = {
  tags: { code: string; label: string }[];
  settings: { key: string; value: unknown }[];
  schools: SeedSchool[];
  veltrhy: { city: string; date: string | null; time: string; place: string; address: string; description: string | null; extra: string | null; schoolSlugs: string[] }[];
  reviews: SeedReview[];
  posts: { type: string; title: string; body: string; coverUrl: string | null; published: boolean; publishedAt: string | null; schoolSlug: string | null }[];
  faq: { group: string; question: string; answer: string; sort: number }[];
};

const toDate = (s: string | null | undefined) => (s ? new Date(`${s}T00:00:00`) : null);

/** Legacy: staré SUPER posty → nový model Review (idempotentné, beží vždy). */
async function migrateSuperPosts() {
  const supers = await prisma.post.findMany({ where: { type: "SUPER" } });
  if (supers.length === 0) return;
  for (const p of supers) {
    // title: "Adam, 21 · SPŠ technická Trnava"
    const m = p.title.match(/^([^,]+),\s*([^·]+?)\s*·/);
    const name = m ? m[1].trim() : p.title;
    const age = m ? m[2].trim() : null;
    await prisma.review.create({
      data: {
        name, age, quote: p.body, photoUrl: p.coverUrl,
        schoolId: p.schoolId, published: p.published, sort: 0,
      },
    });
  }
  await prisma.post.deleteMany({ where: { type: "SUPER" } });
  console.log(`✓ migrovaných ${supers.length} príbehov (SUPER → Review)`);
}

/** FAQ: ak DB je prázdna, naplní ju obsahom z qa-data. Idempotentné, beží vždy. */
async function migrateFaq() {
  if ((await prisma.faq.count()) > 0) return;
  const flat: { group: string; question: string; answer: string; sort: number }[] = [];
  let sort = 0;
  for (const [group, items] of QA) {
    for (const [question, answer] of items) {
      flat.push({ group, question, answer, sort: sort++ });
    }
  }
  await prisma.faq.createMany({ data: flat });
  console.log(`✓ doplnené FAQ (${flat.length} otázok)`);
}

/** Príbehy prenesené z klientom dodaného finálneho demo HTML; idempotentné. */
async function migrateDemoReviews() {
  const imageBase = (process.env.S3_PUBLIC_URL ?? "https://s3.trnavavuc.sk/ttsk-media").replace(/\/$/, "");
  // 1. Vymazať legacy/placeholder recenzie, ponechať len 3 reálne z finálneho návrhu
  const keepNames = ["Eliška Marlengová", "Adam Hagara", "Vivien Vranková"];
  await prisma.review.deleteMany({
    where: {
      name: { notIn: keepNames },
    },
  });

  const stories = [
      {
        name: "Eliška Marlengová",
        title: "Piekla v televíznej súťaži ešte na základnej škole",
        quote: "„Ešte v deviatke som piekla v televíznej súťaži a riešila presne to isté, čo ty teraz: kam ďalej. Vybrala som si hotelovku, lebo tu z koníčka robia remeslo. Máme barmanský aj baristický kurz, varíme na ozajstných podujatiach a na stáž sa dá ísť aj do Talianska.“",
        schoolSlug: "hotelova-akademia-ludovita-wintera",
        photo: "reviews/eliska-marlengova.jpg",
        sort: 10,
      },
      {
        name: "Adam Hagara",
        title: "Olympionik v krasokorčuľovaní",
        quote: "„Naša škola má multifunkčné športovisko priamo v areáli a internát v budove a vychováva špičkových športovcov. Kombinovať vrcholový tréning a maturitu sa dá len tam, kde ti v tom pomáhajú. Preto som dnes olympionik a nie bývalý krasokorčuliar.“",
        schoolSlug: "gymnazium-a-stredna-sportova-skola-jozefa-herdu",
        photo: "reviews/adam-hagara.jpg",
        sort: 20,
      },
      {
        name: "Vivien Vranková",
        title: "Presadila menštruačné pomôcky na školských toaletách",
        quote: "„Chcela som, aby boli menštruačné potreby na školských toaletách bezplatne. Získala som zdroje z participatívneho rozpočtu a o pár týždňov tam boli. Naše gymnázium má vyše 30 rokov, ale nefunguje ako skanzen. Ak máš nápad, tu ti ho nikto nezhodí zo stola.“",
        schoolSlug: "gymnazium-a-stredna-sportova-skola-jozefa-herdu",
        photo: "reviews/vivien-vrankova.jpg",
        sort: 30,
      },
    ];

  let added = 0;
  for (const story of stories) {
    const existing = await prisma.review.findFirst({ where: { name: story.name, quote: story.quote } });
    const school = await prisma.school.findUnique({ where: { slug: story.schoolSlug }, select: { id: true } });
    if (!school) throw new Error(`Chýba škola pre príbeh: ${story.schoolSlug}`);
    const data = {
      age: null,
      title: story.title,
      photoUrl: `${imageBase}/${story.photo}`,
      published: true,
      sort: story.sort,
      schoolId: school.id,
    };
    if (existing) await prisma.review.update({ where: { id: existing.id }, data });
    else {
      await prisma.review.create({ data: { name: story.name, quote: story.quote, ...data } });
      added++;
    }
  }
  console.log(`✓ príbehy z demo HTML: ${added} nové, ${stories.length - added} aktualizované`);
}

async function migrateDemoNews() {
  const imageBase = (process.env.S3_PUBLIC_URL ?? "https://s3.trnavavuc.sk/ttsk-media").replace(/\/$/, "");
  const placeholderTitle = "Sem príde titulok článku o dianí na župných školách";
  await prisma.post.deleteMany({ where: { type: "NEWS", title: placeholderTitle } });

  for (const article of DEMO_NEWS) {
    await prisma.post.upsert({
      where: { slug: article.slug },
      update: {
        type: "NEWS",
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        boxTitle: article.boxTitle ?? null,
        boxBody: article.boxBody ?? null,
        coverUrl: article.coverUrl,
        galleryCaption: article.galleryCaption,
        published: true,
        publishedAt: new Date(`${article.publishedAt}T00:00:00`),
        images: {
          deleteMany: {},
          create: article.gallery.map((image) => ({
            url: `${imageBase}/${image.key}`,
            alt: image.alt,
            sort: image.sort,
          })),
        },
      },
      create: {
        type: "NEWS",
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        boxTitle: article.boxTitle ?? null,
        boxBody: article.boxBody ?? null,
        coverUrl: article.coverUrl,
        galleryCaption: article.galleryCaption,
        published: true,
        publishedAt: new Date(`${article.publishedAt}T00:00:00`),
        images: {
          create: article.gallery.map((image) => ({
            url: `${imageBase}/${image.key}`,
            alt: image.alt,
            sort: image.sort,
          })),
        },
      },
    });
  }
  console.log(`✓ články z demo HTML: ${DEMO_NEWS.length} aktualizované`);
}

async function migrateVeltrhyContent() {
  const existing = await prisma.setting.findUnique({ where: { key: VELTRHY_SECTIONS_KEY } });
  if (!existing) {
    await prisma.setting.create({
      data: { key: VELTRHY_SECTIONS_KEY, value: VELTRHY_SECTIONS_DEFAULT as unknown as never },
    });
    console.log("✓ nahraný obsah veľtrhovej stránky (veltrhy.sections)");
  }
}

async function migrateHeroMedia() {
  const imageBase = (process.env.S3_PUBLIC_URL ?? "https://s3.trnavavuc.sk/ttsk-media").replace(/\/$/, "");
  const upsertIfEmpty = async (key: string, value: string | number | boolean) => {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing?.value) {
      await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }
  };
  await upsertIfEmpty("hero.mediaType", "video");
  await upsertIfEmpty("hero.mediaUrl", `${imageBase}/hero.mp4`);
  await upsertIfEmpty("hero.posterUrl", `${imageBase}/hero-poster.jpg`);
  console.log("✓ hero médiá nastavené (video + poster na S3)");
}

async function migrateDodDates() {
  const DOD_DATES = ["2026-11-12", "2026-11-14", "2026-11-21", "2026-11-28", "2026-12-05"];
  const schools = await prisma.school.findMany({
    where: { isPublished: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  let added = 0;
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const existing = await prisma.dod.count({ where: { schoolId: school.id } });
    if (existing) continue;
    await prisma.dod.create({
      data: { schoolId: school.id, date: new Date(`${DOD_DATES[i % DOD_DATES.length]}T00:00:00`) },
    });
    added++;
  }
  if (added) console.log(`✓ DOD termíny doplnené pre ${added} škôl (demo rozvrh)`);
}

async function main() {
  const data: SeedData = JSON.parse(readFileSync("prisma/seed-data.json", "utf-8"));

  // Vždy migruj legacy SUPER posty (bezpečné aj na prázdnej DB).
  await migrateSuperPosts();
  await migrateFaq();
  await migrateDemoReviews();
  await migrateDemoNews();
  await migrateVeltrhyContent();
  await migrateDodDates();
  await migrateHeroMedia();

  if ((await prisma.school.count()) > 0) {
    console.log("ℹ️ DB už obsahuje školy — seed preskočený.");
    return;
  }

  // 1. Tagy + settings
  await prisma.tag.createMany({ data: data.tags });
  for (const s of data.settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value as never },
      create: { key: s.key, value: s.value as never },
    });
  }

  // 2. Školy (s nested odbormi, projektmi, DOD, downloads, badge + connect tagy/priestory)
  let n = 0;
  for (const s of data.schools) {
    await prisma.school.create({
      data: {
        name: s.name, slug: s.slug, city: s.city, district: s.district,
        languages: s.languages, foreignLanguages: s.foreignLanguages,
        hasInternat: s.hasInternat, internatInfo: s.internatInfo,
        hasCanteen: s.hasCanteen, hasDual: s.hasDual, dualCompanies: s.dualCompanies,
        hasNadstavba: s.hasNadstavba, hasNativeSpeaker: s.hasNativeSpeaker,
        accessibility: s.accessibility, erasmus: s.erasmus,
        websites: s.websites ?? [], email: s.email, phone: s.phone, facebook: s.facebook, instagram: s.instagram,
        address: s.address, mapUrl: s.mapUrl,
        inekoKrajRank: s.inekoKrajRank ?? null, inekoKrajOf: s.inekoKrajOf ?? null, inekoSkRank: s.inekoSkRank ?? null, inekoSkOf: s.inekoSkOf ?? null,
        internatType: s.internatType ?? null, erasmusCountries: s.erasmusCountries ?? [],
        hasMaturita: s.hasMaturita ?? false, hasVl: s.hasVl ?? false,
        totalStudents: s.totalStudents, photoUrl: s.photoUrl, logoUrl: s.logoUrl,
        intro: s.intro, practice: s.practice, modernization: s.modernization, plans: s.plans,
        support: s.support, achievements: s.achievements, partners: s.partners, graduates: s.graduates,
        other: s.other, otherTop: s.otherTop,
        whyUs: s.whyUs, clubs: s.clubs, sports: s.sports, canteenOptions: s.canteenOptions,
        supportTeam: s.supportTeam, certificates: s.certificates,
        isComplete: s.isComplete, isPublished: s.isPublished,
        tags: { connect: s.tagCodes.map((code) => ({ code })) },
        odbory: { create: s.odbory.map((o) => ({ code: o.code, name: o.name, length: o.length, completion: o.completion as Completion, accepts: o.accepts, appliedLastYear: o.appliedLastYear, places: o.places, employment: o.employment, sort: o.sort })) },
        projects: { create: s.projects.map((p) => ({ title: p.title, description: p.description, sort: p.sort })) },
        dods: { create: s.dods.map((d) => ({ date: toDate(d.date)!, time: d.time, note: d.note })) },
        downloads: { create: s.downloads.map((d) => ({ title: d.title, fileUrl: d.fileUrl, fileName: d.fileName, sort: d.sort })) },
        badges: { create: s.badges.map((b) => ({ label: b.label, kind: b.kind, note: b.note })) },
      },
    });
    n++;
  }
  console.log(`✓ ${n} škôl`);

  // 3. Veľtrhy + priradené školy
  for (const v of data.veltrhy) {
    await prisma.veltrh.create({
      data: {
        city: v.city, date: toDate(v.date)!, time: v.time, place: v.place, address: v.address,
        description: v.description, extra: v.extra,
        schools: { connect: v.schoolSlugs.map((slug) => ({ slug })) },
      },
    });
  }
  console.log(`✓ ${data.veltrhy.length} veľtrhov`);

  // 4. Recenzie (príbehy „Moja stredná je super")
  // Reálne príbehy z demo návrhu sa vytvorili/aktualizovali už v migrateDemoReviews() vyššie.
  console.log(`✓ recenzie synchronizované z demo HTML`);

  // 5. Články sa už idempotentne vložili z DEMO_NEWS vyššie. Starší seed-data.json
  // obsahuje len historické placeholdery, preto ho sem zámerne znovu neimportujeme.
  console.log(`✓ ${DEMO_NEWS.length} postov z finálneho demo HTML`);

  // 6. Používatelia (3 roly) — demo heslo „najdi2026"
  const pass = await bcrypt.hash("najdi2026", 10);
  await prisma.user.createMany({
    data: [
      { email: "admin@ttsk.sk", name: "Administrátor", role: Role.ADMIN, passwordHash: pass },
      { email: "scholstvo@ttsk.sk", name: "Odbor školstva", role: Role.SCHOLSTVO, passwordHash: pass },
      {
        email: "skola@demo.sk",
        name: "Gymnázium Ladislava Dúbravu",
        role: Role.SKOLA,
        passwordHash: pass,
        schoolId: (await prisma.school.findUnique({ where: { slug: "gymnazium-ladislava-dubravu" }, select: { id: true } }))?.id ?? null,
      },
    ],
  });
  console.log("✓ 3 používatelia (heslo: najdi2026)");

  const counts = {
    schools: await prisma.school.count(),
    odbory: await prisma.odbor.count(),
    projects: await prisma.project.count(),
    reviews: await prisma.review.count(),
    posts: await prisma.post.count(),
    faq: await prisma.faq.count(),
  };
  console.log("✅ Seed dokončený:", counts);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("❌ Seed zlyhal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
