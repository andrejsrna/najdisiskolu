import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SafeRichText from "@/components/SafeRichText";
import { prisma } from "@/lib/prisma";
import ArticleGallery from "./ArticleGallery";

export const dynamic = "force-dynamic";

const fmtDate = (date: Date) => date.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where: { slug, type: "NEWS", published: true },
    include: { images: { orderBy: { sort: "asc" } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Nájdi si školu`,
    description: post.excerpt ?? undefined,
    openGraph: { title: post.title, description: post.excerpt ?? undefined, images: post.coverUrl ? [post.coverUrl] : undefined },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const more = await prisma.post.findMany({
    where: { type: "NEWS", published: true, slug: { not: null, notIn: [post.slug ?? ""] } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 2,
  });

  return (
    <main className="article-page">
      {post.coverUrl ? (
        <div className="article-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverUrl} alt="" />
        </div>
      ) : null}
      <div className="wrap article-back"><Link href="/spravy">← Späť na dobré správy</Link></div>
      <article className="article-wrap">
        <header>
          {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{fmtDate(post.publishedAt)}</time>}
          <h1>{post.title}</h1>
          {post.excerpt && <p className="article-excerpt">{post.excerpt}</p>}
        </header>
        <SafeRichText html={post.body} />
        <ArticleGallery images={post.images} caption={post.galleryCaption} />
        {more.length > 0 && (
          <section className="article-more" aria-labelledby="article-more-heading">
            <h2 id="article-more-heading">Ďalšie dobré správy</h2>
            <div>
              {more.map((item) => (
                <article className="post" key={item.id}>
                  <Link href={`/spravy/${item.slug}`} className="photo">
                    {item.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverUrl} alt="" />
                    )}
                  </Link>
                  {item.publishedAt && <time dateTime={item.publishedAt.toISOString()}>{fmtDate(item.publishedAt)}</time>}
                  <h3><Link href={`/spravy/${item.slug}`}>{item.title}</Link></h3>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
