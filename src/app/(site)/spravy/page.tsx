import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fmtDate = (date: Date) => date.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

export default async function NewsPage() {
  const posts = await prisma.post.findMany({
    where: { type: "NEWS", published: true, slug: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="news-page">
      <div className="wrap">
        <div className="news-heading">
          <p className="eyebrow">Trnavský samosprávny kraj</p>
          <h1>Dobré správy zo školstva</h1>
          <p>Inšpiratívne dianie, pomoc pre žiakov a nové príležitosti na župných stredných školách.</p>
        </div>
        {posts.length ? (
          <div className="news-grid">
            {posts.map((post) => (
              <article className="news-card" key={post.id}>
                <Link href={`/spravy/${post.slug}`} className="news-card-image" aria-label={`Prečítať: ${post.title}`}>
                  {post.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverUrl} alt="" />
                  ) : <span>Dobré správy zo školstva</span>}
                </Link>
                <div className="news-card-body">
                  {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{fmtDate(post.publishedAt)}</time>}
                  <h2><Link href={`/spravy/${post.slug}`}>{post.title}</Link></h2>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  <Link className="news-read-more" href={`/spravy/${post.slug}`}>Prečítať článok →</Link>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty">Články pripravujeme.</div>}
      </div>
    </main>
  );
}
