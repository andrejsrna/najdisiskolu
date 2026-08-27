// Export celého obsahu DB → prisma/seed-data.json (idempotentný seed).
// Spustenie: npx tsx scripts/export-seed.ts
// Pri exporte doplní aj demo príbehy („Moja stredná je super") a články („Dobré správy").
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const d10 = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

async function main() {
  // 1. Doplniť demo posty (príbehy + články), ak ešte žiadne nie sú.
  if ((await prisma.post.count()) === 0) {
    const bySlug = async (slug: string) =>
      (await prisma.school.findUnique({ where: { slug }, select: { id: true } }))?.id ?? null;
    const [tech, holleho, podnik] = await Promise.all([
      bySlug("stredna-priemyselna-skola-technicka"),
      bySlug("gymnazium-jana-holleho"),
      bySlug("stredna-odborna-skola-podnikania-v-remeslach-a-sluzbach"),
    ]);
    await prisma.post.createMany({
      data: [
        { type: "SUPER", title: "Adam, 21 · SPŠ technická Trnava", body: "„Bál som sa, že strojárina je len o špine.\"", schoolId: tech, published: true, publishedAt: new Date("2026-08-15") },
        { type: "SUPER", title: "Nina, 19 · Gymnázium Jána Hollého", body: "„Gymnázium ma naučilo učiť sa.\"", schoolId: holleho, published: true, publishedAt: new Date("2026-08-14") },
        { type: "SUPER", title: "Sára, 22 · SOŠ podnikania v remeslách a službách Senica", body: "„Po troch rokoch som mala vlastný salón.\"", schoolId: podnik, published: true, publishedAt: new Date("2026-08-13") },
        { type: "NEWS", title: "Sem príde titulok článku o dianí na župných školách", body: "", published: true, publishedAt: new Date("2026-08-12") },
        { type: "NEWS", title: "Sem príde titulok článku o dianí na župných školách", body: "", published: true, publishedAt: new Date("2026-08-07") },
        { type: "NEWS", title: "Sem príde titulok článku o dianí na župných školách", body: "", published: true, publishedAt: new Date("2026-08-01") },
      ],
    });
    console.log("✓ doplnené demo posty (3 príbehy + 3 články)");
  }

  // 2. Export všetkých dát.
  const schools = await prisma.school.findMany({
    include: { tags: true, priestory: true, odbory: true, projects: true, dods: true, downloads: true, badges: true },
  });
  const veltrhy = await prisma.veltrh.findMany({ include: { schools: true } });
  const posts = await prisma.post.findMany({ include: { school: { select: { slug: true } } } });

  const data = {
    tags: (await prisma.tag.findMany({ orderBy: { code: "asc" } })).map((t) => ({ code: t.code, label: t.label })),
    priestory: (await prisma.priestor.findMany({ orderBy: { name: "asc" } })).map((p) => ({ name: p.name })),
    settings: (await prisma.setting.findMany({ orderBy: { key: "asc" } })).map((s) => ({ key: s.key, value: s.value })),
    schools: schools.map((s) => ({
      name: s.name, slug: s.slug, city: s.city, district: s.district,
      languages: s.languages, foreignLanguages: s.foreignLanguages,
      hasInternat: s.hasInternat, internatInfo: s.internatInfo,
      hasCanteen: s.hasCanteen, hasDual: s.hasDual, dualCompanies: s.dualCompanies,
      hasNadstavba: s.hasNadstavba, hasNativeSpeaker: s.hasNativeSpeaker,
      accessibility: s.accessibility, erasmus: s.erasmus,
      website: s.website, email: s.email, phone: s.phone, facebook: s.facebook, instagram: s.instagram,
      address: s.address, mapUrl: s.mapUrl,
      inekoKraj: s.inekoKraj, inekoSlovensko: s.inekoSlovensko,
      totalStudents: s.totalStudents, photoUrl: s.photoUrl, logoUrl: s.logoUrl,
      intro: s.intro, practice: s.practice, modernization: s.modernization, plans: s.plans,
      support: s.support, achievements: s.achievements, partners: s.partners, graduates: s.graduates,
      other: s.other, otherTop: s.otherTop,
      whyUs: s.whyUs, clubs: s.clubs, sports: s.sports, canteenOptions: s.canteenOptions,
      supportTeam: s.supportTeam, certificates: s.certificates,
      isComplete: s.isComplete, isPublished: s.isPublished,
      tagCodes: s.tags.map((t) => t.code),
      priestorNames: s.priestory.map((p) => p.name),
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
    posts: posts.map((p) => ({
      type: p.type, title: p.title, body: p.body, coverUrl: p.coverUrl,
      published: p.published, publishedAt: d10(p.publishedAt), schoolSlug: p.school?.slug ?? null,
    })),
  };

  writeFileSync("prisma/seed-data.json", JSON.stringify(data, null, 2), "utf-8");
  console.log(
    `✓ export hotový: ${data.schools.length} škôl, ${data.posts.length} postov, ${data.veltrhy.length} veľtrhov, ${data.tags.length} tagov`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
