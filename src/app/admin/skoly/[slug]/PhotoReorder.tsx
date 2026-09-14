"use client";

import { useState, useTransition } from "react";
import {
  deleteSchoolPhoto,
  reorderSchoolPhotos,
  setSchoolPhotoCover,
} from "@/lib/school-actions";

type Photo = {
  id: string;
  url: string;
  alt: string | null;
  isDetailCover: boolean;
  isListCover: boolean;
};

/** Drag&drop zoznam fotiek — poradie sa uloží ako sort (1 = prvá v galérii). */
export function PhotoReorder({
  schoolId,
  slug,
  photos,
  schoolName,
}: {
  schoolId: string;
  slug: string;
  photos: Photo[];
  schoolName: string;
}) {
  const [items, setItems] = useState(photos);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const move = (id: string, dir: -1 | 1) => {
    setSaved(false);
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return setDragId(null), setOverId(null);
    setSaved(false);
    setItems((prev) => {
      const from = prev.findIndex((p) => p.id === dragId);
      const to = prev.findIndex((p) => p.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
    setOverId(null);
  };

  const save = () => {
    startTransition(async () => {
      await reorderSchoolPhotos(schoolId, slug, items.map((p) => p.id));
      setSaved(true);
    });
  };

  const orderChanged = items.some((p, i) => p.id !== photos[i]?.id);

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((photo, index) => (
          <li
            key={photo.id}
            draggable
            onDragStart={() => setDragId(photo.id)}
            onDragEnd={() => { setDragId(null); setOverId(null); }}
            onDragOver={(e) => { e.preventDefault(); setOverId(photo.id); }}
            onDrop={(e) => { e.preventDefault(); onDrop(photo.id); }}
            className={`flex items-center gap-3 rounded-lg border p-2 transition-colors ${
              overId === photo.id && dragId !== photo.id
                ? "border-slate-900 bg-slate-100"
                : "border-slate-200 bg-white"
            } ${dragId === photo.id ? "opacity-50" : ""}`}
            style={{ cursor: "grab" }}
          >
            <span className="select-none text-xs text-slate-400">{index + 1}.</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.alt ?? schoolName} className="h-16 w-24 flex-none rounded object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1 text-xs">
                {photo.isDetailCover && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">Titulná detailu</span>}
                {photo.isListCover && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">Titulná zoznamu</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <form action={setSchoolPhotoCover.bind(null, schoolId, slug, photo.id, "detail")}>
                  <button type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                    Titulná detailu
                  </button>
                </form>
                <form action={setSchoolPhotoCover.bind(null, schoolId, slug, photo.id, "list")}>
                  <button type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                    Titulná zoznamu
                  </button>
                </form>
                <form action={deleteSchoolPhoto.bind(null, schoolId, slug, photo.id)}>
                  <button type="submit" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                    Zmazať
                  </button>
                </form>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => move(photo.id, -1)}
                disabled={index === 0}
                className="rounded border border-slate-300 px-1.5 text-xs leading-5 hover:bg-slate-50 disabled:opacity-30"
                aria-label="Posunúť vyššie"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(photo.id, 1)}
                disabled={index === items.length - 1}
                className="rounded border border-slate-300 px-1.5 text-xs leading-5 hover:bg-slate-50 disabled:opacity-30"
                aria-label="Posunúť nižšie"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>

      {orderChanged && (
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Ukladám…" : "Uložiť poradie fotiek"}
        </button>
      )}
      {saved && !orderChanged && (
        <span className="ml-3 text-sm text-emerald-600">Poradie uložené ✓</span>
      )}
    </div>
  );
}
