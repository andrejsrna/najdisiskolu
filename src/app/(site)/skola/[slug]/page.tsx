import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/site";
import { getSchoolBySlug } from "@/lib/school-query";
import { SchoolDetailView } from "./SchoolDetailView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await prisma.school.findUnique({
    where: { slug },
    select: {
      name: true,
      city: true,
      district: true,
      intro: true,
      logoUrl: true,
      isPublished: true,
    },
  });
  if (!school || !school.isPublished) return {};

  const title = `${school.name} — ${school.city}`;
  const description =
    stripHtml(school.intro) ||
    `Stredná škola ${school.name} v okrese ${school.district}. Prehľad odborov, kritérií prijatia a dňa otvorených dverí.`;

  return {
    title,
    description,
    alternates: { canonical: `/skola/${slug}` },
    openGraph: {
      title,
      description,
      url: `/skola/${slug}`,
      type: "website",
      images: school.logoUrl ? [{ url: school.logoUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SchoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const school = await getSchoolBySlug(slug);
  if (!school || !school.isPublished) notFound();

  return <SchoolDetailView school={school} from={from} />;
}
