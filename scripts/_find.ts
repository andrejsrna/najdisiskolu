
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const schools = await prisma.school.findMany({ select: { id: true, name: true, slug: true } });
  for (const q of ["technická", "Hollého", "podnikania"]) {
    const hits = schools.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
    console.log(`\n"${q}":`);
    for (const h of hits) console.log("  ", h.slug, "|", h.name);
  }
  await prisma.$disconnect();
}
main();
