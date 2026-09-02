import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const schools = await prisma.school.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1, lastModified: new Date() },
    { url: `${SITE_URL}/veltrhy`, changeFrequency: "weekly", priority: 0.8, lastModified: new Date() },
    { url: `${SITE_URL}/otazky`, changeFrequency: "monthly", priority: 0.6, lastModified: new Date() },
  ];

  const schoolPages: MetadataRoute.Sitemap = schools.map((s) => ({
    url: `${SITE_URL}/skola/${s.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    lastModified: s.updatedAt,
  }));

  return [...staticPages, ...schoolPages];
}