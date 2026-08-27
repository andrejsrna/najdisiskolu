// Seed — overenie schémy: role, tagy, priestory, odbory, badge, DOD, download.
// Úplný import 44 škôl z HTML prototypu je samostatný krok (scripts/import-from-html.ts).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role, Completion, PostType } from "../src/generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  // 1. Tagy (zameranie → vyhľadávanie na homepage)
  const tags: [string, string][] = [
    ["gym", "Gymnáziá a všeobecné vzdelanie"],
    ["tech", "Technika a priemysel"],
    ["it", "IT a elektrotechnika"],
    ["dop", "Doprava a logistika"],
    ["eko", "Ekonomika, obchod a administratíva"],
    ["gas", "Gastronómia, hotelierstvo a služby"],
    ["zdr", "Zdravotníctvo, pedagogika a sociálna práca"],
    ["ume", "Umenie a dizajn"],
    ["pol", "Poľnohospodárstvo a potravinárstvo"],
    ["spo", "Šport"],
  ];
  for (const [code, label] of tags) {
    await prisma.tag.upsert({
      where: { code },
      update: { label },
      create: { code, label },
    });
  }

  // 2. Predvybraté priestory a vybavenie (môže ich rozširovať odbor školstva)
  const priestory = [
    "telocvičňa",
    "posilňovňa",
    "multifunkčné ihrisko",
    "bežecký okruh",
    "športová hala",
    "plaváreň",
    "odborné dielne",
    "laboratóriá",
    "knižnica",
    "školský internát",
  ];
  for (const name of priestory) {
    await prisma.priestor.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Demo škola (odbor + badge + DOD + download) — overenie relácií
  const school = await prisma.school.upsert({
    where: { slug: "gymnazium-ladislava-dubravu" },
    update: {},
    create: {
      name: "Gymnázium Ladislava Dúbravu",
      slug: "gymnazium-ladislava-dubravu",
      city: "Dunajská Streda",
      district: "Dunajská Streda",
      languages: ["sk"],
      hasCanteen: true,
      website: "www.gymnaziumds.edupage.org",
      email: "gymds@gymds.sk",
      phone: "+421315522334",
      accessibility: "áno",
      totalStudents: "420",
      intro: "Demo škola pre overenie dátového modelu.",
      whyUs: ["Všeobecné vzdelávanie v 4-ročnom a 8-ročnom štúdiu"],
      tags: { connect: [{ code: "gym" }] },
      priestory: { connect: [{ name: "telocvičňa" }, { name: "posilňovňa" }] },
      isComplete: true,
    },
  });

  await prisma.odbor.upsert({
    where: { id: "demo-odbor-gym" },
    update: {},
    create: {
      id: "demo-odbor-gym",
      schoolId: school.id,
      code: "7902 J",
      name: "Gymnázium",
      length: 4,
      completion: Completion.MATURITA,
      accepts: 120,
      appliedLastYear: 3,
      places: 120,
      employment: "pokračovanie na vysokej škole doma aj v zahraničí",
    },
  });

  await prisma.badge.createMany({
    data: [{ schoolId: school.id, label: "Voľné miesta", kind: "ok", createdBy: "seed" }],
    skipDuplicates: true,
  });

  await prisma.dod.createMany({
    data: [
      {
        schoolId: school.id,
        date: new Date("2026-11-12"),
        time: "8:00 - 12:00",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.download.createMany({
    data: [
      {
        schoolId: school.id,
        title: "Kritériá prijatia 2026/2027",
        fileUrl: "https://example.com/kriteria.pdf",
        fileName: "kriteria.pdf",
      },
    ],
    skipDuplicates: true,
  });

  // 4. Používatelia (3 role)
  const pass = await bcrypt.hash("najdi2026", 10);
  const users: [string, string, Role, string?][] = [
    ["admin@ttsk.sk", "Administrátor", Role.ADMIN, undefined],
    ["scholstvo@ttsk.sk", "Odbor školstva", Role.SCHOLSTVO, undefined],
    ["skola@demo.sk", "Gymnázium Ladislava Dúbravu", Role.SKOLA, school.id],
  ];
  for (const [email, name, role, schoolId] of users) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role, schoolId, passwordHash: pass },
    });
  }

  // 5. Nastavenia (hero + štatistiky)
  const settings: [string, unknown][] = [
    ["hero.title", "Vyber si strednú"],
    ["hero.subtitle", "Nájdi školu, ktorá ťa posunie ďalej."],
    ["hero.hidden", false],
    ["cred.schools", 44],
    ["cred.programs", 126],
    ["cred.places", 4403],
    ["cred.dual", 911],
  ];
  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    schools: await prisma.school.count(),
    odbory: await prisma.odbor.count(),
    tags: await prisma.tag.count(),
    priestory: await prisma.priestor.count(),
  };
  console.log("✅ Seed hotový:", counts);
}

main()
  .catch((e) => {
    console.error("❌ Seed zlyhal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
