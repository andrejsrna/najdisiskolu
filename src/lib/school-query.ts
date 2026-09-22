import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Zdieľaný include pre detail školy — používa ho jednotlivý detail aj hromadná tlač. */
export const schoolDetailInclude = {
  tags: { orderBy: { label: "asc" } },
  odbory: { orderBy: { sort: "asc" } },
  projects: { orderBy: { sort: "asc" } },
  dods: { orderBy: { date: "asc" } },
  downloads: { orderBy: { sort: "asc" } },
  badges: { orderBy: { createdAt: "desc" } },
  photos: { orderBy: { sort: "asc" } },
  similarTo: {
    where: { isPublished: true },
    include: {
      photos: { orderBy: { sort: "asc" } },
      odbory: true,
      badges: true,
    },
    take: 3,
  },
} satisfies Prisma.SchoolInclude;

export type SchoolDetailData = Prisma.SchoolGetPayload<{ include: typeof schoolDetailInclude }>;

export async function getSchoolBySlug(slug: string) {
  return prisma.school.findUnique({
    where: { slug },
    include: schoolDetailInclude,
  });
}

/** Pre hromadnú tlač — načíta viac škôl a vráti ich v poradí zadaných slugov. */
export async function getSchoolsBySlugs(slugs: string[]): Promise<SchoolDetailData[]> {
  const unique = [...new Set(slugs)].filter(Boolean);
  if (unique.length === 0) return [];
  const schools = await prisma.school.findMany({
    where: { slug: { in: unique }, isPublished: true },
    include: schoolDetailInclude,
  });
  const bySlug = new Map(schools.map((s) => [s.slug, s]));
  return unique.map((slug) => bySlug.get(slug)).filter((s): s is SchoolDetailData => Boolean(s));
}
