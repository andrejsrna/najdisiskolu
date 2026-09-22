// Export celého obsahu DB → prisma/seed-data.json (idempotentný seed).
// Spustenie: npx tsx scripts/export-seed.ts
// Pri exporte doplní aj demo príbehy (recenzie) a články („Dobré správy"), ak žiadne nie sú.
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { QA } from "../src/lib/qa-data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const d10 = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

async function main() {
  const bySlug = async (slug: string) =>
    (await prisma.school.findUnique({ where: { slug }, select: { id: true } }))?.id ?? null;

  // 1. Doplniť demo recenzie (príbehy), ak ešte žiadne nie sú.
  if ((await prisma.review.count()) === 0) {
    const [hotel, herdu] = await Promise.all([
      bySlug("hotelova-akademia-ludovita-wintera"),
      bySlug("gymnazium-a-stredna-sportova-skola-jozefa-herdu"),
    ]);
    const imageBase = "https://s3.trnavavuc.sk/ttsk-media";
    await prisma.review.createMany({
      data: [
        {
          name: "Eliška Marlengová",
          age: null,
          title: "Piekla v televíznej súťaži ešte na základnej škole",
          quote: "„Ešte v deviatke som piekla v televíznej súťaži a riešila presne to isté, čo ty teraz: kam ďalej. Vybrala som si hotelovku, lebo tu z koníčka robia remeslo. Máme barmanský aj baristický kurz, varíme na ozajstných podujatiach a na stáž sa dá ísť aj do Talianska.“",
          photoUrl: `${imageBase}/reviews/eliska-marlengova.jpg`,
          schoolId: hotel,
          published: true,
          sort: 10,
        },
        {
          name: "Adam Hagara",
          age: null,
          title: "Olympionik v krasokorčuľovaní",
          quote: "„Naša škola má multifunkčné športovisko priamo v areáli a internát v budove a vychováva špičkových športovcov. Kombinovať vrcholový tréning a maturitu sa dá len tam, kde ti v tom pomáhajú. Preto som dnes olympionik a nie bývalý krasokorčuliar.“",
          photoUrl: `${imageBase}/reviews/adam-hagara.jpg`,
          schoolId: herdu,
          published: true,
          sort: 20,
        },
        {
          name: "Vivien Vranková",
          age: null,
          title: "Presadila menštruačné pomôcky na školských toaletách",
          quote: "„Chcela som, aby boli menštruačné potreby na školských toaletách bezplatne. Získala som zdroje z participatívneho rozpočtu a o pár týždňov tam boli. Naše gymnázium má vyše 30 rokov, ale nefunguje ako skanzen. Ak máš nápad, tu ti ho nikto nezhodí zo stola.“",
          photoUrl: `${imageBase}/reviews/vivien-vrankova.jpg`,
          schoolId: herdu,
          published: true,
          sort: 30,
        },
      ],
    });
    console.log("✓ doplnené demo recenzie (3 príbehy z finálneho návrhu)");
  }

  // 2. Doplniť demo články („Dobré správy"), ak ešte žiadne nie sú.
  if ((await prisma.post.count()) === 0) {
    await prisma.post.createMany({
      data: [
        { type: "NEWS", title: "Sem príde titulok článku o dianí na župných školách", body: "", published: true, publishedAt: new Date("2026-08-12") },
        { type: "NEWS", title: "Sem príde titulok článku o dianí na župných školách", body: "", published: true, publishedAt: new Date("2026-08-07") },
        { type: "NEWS", title: "Sem príde titulok článku o dianí na župných školách", body: "", published: true, publishedAt: new Date("2026-08-01") },
      ],
    });
    console.log("✓ doplnené demo články (3)");
  }

  // 2.5 Doplniť FAQ (často kladené otázky), ak ešte žiadne nie sú.
  if ((await prisma.faq.count()) === 0) {
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

  // 3. Export všetkých dát.
  const schools = await prisma.school.findMany({
    include: { tags: true, odbory: true, projects: true, dods: true, downloads: true, badges: true },
  });
  const veltrhy = await prisma.veltrh.findMany({ include: { schools: true } });
  const reviews = await prisma.review.findMany({ include: { school: { select: { slug: true } } }, orderBy: { sort: "asc" } });
  const posts = await prisma.post.findMany({
    where: { type: "NEWS" },
    include: { images: { orderBy: { sort: "asc" } } },
    orderBy: { publishedAt: "desc" },
  });
  const faqs = await prisma.faq.findMany({ orderBy: { sort: "asc" } });

  const data = {
    tags: (await prisma.tag.findMany({ orderBy: { code: "asc" } })).map((t) => ({ code: t.code, label: t.label })),
    settings: (await prisma.setting.findMany({ orderBy: { key: "asc" } })).map((s) => ({ key: s.key, value: s.value })),
    schools: schools.map((s) => ({
      name: s.name, slug: s.slug, city: s.city, district: s.district,
      languages: s.languages, foreignLanguages: s.foreignLanguages,
      hasInternat: s.hasInternat, internatInfo: s.internatInfo,
      hasCanteen: s.hasCanteen, hasDual: s.hasDual, dualCompanies: s.dualCompanies,
      hasNadstavba: s.hasNadstavba, hasNativeSpeaker: s.hasNativeSpeaker,
      accessibility: s.accessibility, erasmus: s.erasmus,
      websites: s.websites, email: s.email, phone: s.phone, facebook: s.facebook, instagram: s.instagram,
      address: s.address, mapUrl: s.mapUrl,
      inekoKrajRank: s.inekoKrajRank, inekoKrajOf: s.inekoKrajOf, inekoSkRank: s.inekoSkRank, inekoSkOf: s.inekoSkOf,
      internatType: s.internatType, erasmusCountries: s.erasmusCountries,
      hasMaturita: s.hasMaturita, hasVl: s.hasVl,
      totalStudents: s.totalStudents, photoUrl: s.photoUrl, logoUrl: s.logoUrl,
      intro: s.intro, practice: s.practice, modernization: s.modernization, plans: s.plans,
      support: s.support, achievements: s.achievements, partners: s.partners, graduates: s.graduates,
      other: s.other, otherTop: s.otherTop,
      whyUs: s.whyUs, clubs: s.clubs, sports: s.sports, canteenOptions: s.canteenOptions,
      supportTeam: s.supportTeam, certificates: s.certificates,
      isComplete: s.isComplete, isPublished: s.isPublished,
      tagCodes: s.tags.map((t) => t.code),
      odbory: s.odbory.map((o) => ({
        code: o.code, name: o.name, length: o.length, completion: o.completion,
        accepts: o.accepts, appliedLastYear: o.appliedLastYear, places: o.places,
        employment: o.employment, sort: o.sort,
      })),
      projects: s.projects.map((p) => ({ title: p.title, description: p.description, sort: p.sort })),
      dods: s.dods.map((d) => ({ date: d10(d.date), time: d.time, note: d.note })),
      downloads: s.downloads.map((d) => ({ title: d.title, fileUrl: d.fileUrl, fileName: d.fileName, sort: d.sort })),
      badges: s.badges.map((b) => ({ label: b.label, kind: b.kind, note: b.note })),
    })),
    veltrhy: veltrhy.map((v) => ({
      city: v.city, date: d10(v.date), time: v.time, place: v.place, address: v.address,
      description: v.description, extra: v.extra, schoolSlugs: v.schools.map((s) => s.slug),
    })),
    reviews: reviews.map((r) => ({
      name: r.name, age: r.age, title: r.title, quote: r.quote, photoUrl: r.photoUrl,
      published: r.published, sort: r.sort, schoolSlug: r.school?.slug ?? null,
    })),
    posts: posts.map((p) => ({
      type: p.type,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      body: p.body,
      coverUrl: p.coverUrl,
      galleryCaption: p.galleryCaption,
      images: p.images.map((image) => ({ url: image.url, alt: image.alt, sort: image.sort })),
      published: p.published,
      publishedAt: d10(p.publishedAt),
      schoolSlug: null,
    })),
    faq: faqs.map((f) => ({ group: f.group, question: f.question, answer: f.answer, sort: f.sort })),
  };

  writeFileSync("prisma/seed-data.json", JSON.stringify(data, null, 2), "utf-8");
  console.log(
    `✓ export hotový: ${data.schools.length} škôl, ${data.reviews.length} recenzií, ${data.posts.length} postov, ${data.veltrhy.length} veľtrhov, ${data.tags.length} tagov`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
