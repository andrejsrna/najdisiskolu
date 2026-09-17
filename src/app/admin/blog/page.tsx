import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { savePost, deletePost } from "@/lib/admin-actions";
import RichTextEditor from "@/components/RichTextEditor";
import { BlogGalleryUpload } from "./BlogGalleryUpload";
import { CoverImageUpload } from "./CoverImageUpload";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const { edit } = await searchParams;
  const editing = edit
    ? await prisma.post.findUnique({ where: { id: edit }, include: { images: { orderBy: { sort: "asc" } } } })
    : null;

  const posts = await prisma.post.findMany({
    where: { type: "NEWS" },
    include: { images: { orderBy: { sort: "asc" }, take: 1 } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  const publishedDate = editing?.publishedAt?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Blog</h1>
        <p className="text-sm text-slate-500">„Dobré správy zo školstva&quot;.</p>
      </div>

      <form
        action={savePost}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {editing ? "Upraviť článok" : "Nový článok"}
          </div>
          {editing && (
            <a href="/admin/blog" className="text-sm text-slate-500 hover:text-slate-900">
              Zrušiť úpravu
            </a>
          )}
        </div>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <div>
            <label className={label}>Nadpis</label>
            <input name="title" required defaultValue={editing?.title ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Dátum publikovania</label>
            <input name="publishedAt" type="date" defaultValue={publishedDate} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>URL článku</label>
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
            <span>/spravy/</span>
            <input name="slug" defaultValue={editing?.slug ?? ""} placeholder="vygeneruje sa z nadpisu" className="min-w-0 flex-1 bg-transparent py-2 text-slate-900 outline-none" />
          </div>
        </div>
        <div>
          <label className={label}>Perex</label>
          <textarea name="excerpt" defaultValue={editing?.excerpt ?? ""} rows={3} className={input} />
        </div>
        <div>
          <label className={label}>Text článku</label>
          <RichTextEditor name="body" defaultValue={editing?.body ?? ""} />
        </div>
        <div>
          <label className={label}>Názov kontaktného boxu</label>
          <input name="boxTitle" defaultValue={editing?.boxTitle ?? ""} className={input} placeholder="Napr. Kde nájdeš pomoc" />
        </div>
        <div>
          <label className={label}>Obsah kontaktného boxu (rich text)</label>
          <RichTextEditor name="boxBody" defaultValue={editing?.boxBody ?? ""} />
          <p className="mt-1 text-xs text-slate-500">Voliteľný zvýraznený blok (čierny `.artbox`) na konci článku. Formátuj bežnými tlačidlami — žiadne ručné značky.</p>
        </div>
        <div>
          <label className={label}>Titulná fotografia</label>
          <CoverImageUpload
              name="coverUrl"
              initial={editing?.coverUrl ?? ""}
              initialFocalX={editing?.coverFocalX ?? 50}
              initialFocalY={editing?.coverFocalY ?? 50}
            />
        </div>
        <div>
          <label className={label}>Fotogaléria</label>
          <BlogGalleryUpload initial={editing?.images ?? []} />
          <p className="mt-1 text-xs text-slate-500">Pretiahni fotky na nahratie, poradie určuješ pretiahnutím v mriežke.</p>
        </div>
        <div>
          <label className={label}>Popis galérie</label>
          <input name="galleryCaption" defaultValue={editing?.galleryCaption ?? ""} className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="published"
            defaultChecked={editing?.published ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          Zverejnené
        </label>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {editing ? "Uložiť zmeny" : "Vytvoriť článok"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nadpis</th>
              <th className="px-4 py-2.5 font-medium">Stav</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Žiadne články.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {p.images[0]?.url || p.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]?.url ?? p.coverUrl ?? ""} alt="" className="h-10 w-14 rounded object-cover" />
                    ) : null}
                    <div>
                      <a
                        href={`/admin/blog?edit=${p.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {p.title}
                      </a>
                      {p.slug && (
                        <a href={`/spravy/${p.slug}`} target="_blank" rel="noreferrer" className="mt-0.5 block text-xs text-slate-500 hover:underline">
                          /spravy/{p.slug} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  {p.published ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      zverejnené
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      koncept
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deletePost.bind(null, p.id)}>
                    <button className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">
                      Zmazať
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}