"use client";

import { useEffect, useState, useTransition } from "react";
import { reorderOdbory } from "@/lib/school-actions";

type Odbor = { id: string; code: string; name: string };

/** Drag&drop zoznam odborov — poradie sa uloží ako sort (1 = prvý v tabuľke na detaile školy). */
export function OdborReorder({
  schoolId,
  slug,
  odbory,
}: {
  schoolId: string;
  slug: string;
  odbory: Odbor[];
}) {
  const [items, setItems] = useState(odbory);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [savedOrder, setSavedOrder] = useState(() => odbory.map((o) => o.id).join(","));

  // Server po revalidácii pošle nový zoznam (napr. po pridaní/zmazaní odboru) — zosynchronizuj.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setItems(odbory);
      setSavedOrder(odbory.map((o) => o.id).join(","));
    });
    return () => cancelAnimationFrame(frame);
  }, [odbory]);

  const move = (id: string, dir: -1 | 1) => {
    setSaved(false);
    setItems((prev) => {
      const i = prev.findIndex((o) => o.id === id);
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
      const from = prev.findIndex((o) => o.id === dragId);
      const to = prev.findIndex((o) => o.id === targetId);
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
      await reorderOdbory(schoolId, slug, items.map((o) => o.id));
      setSavedOrder(items.map((o) => o.id).join(","));
      setSaved(true);
    });
  };

  const orderChanged = items.map((o) => o.id).join(",") !== savedOrder;

  if (items.length < 2) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-medium text-slate-500">
        Poradie odborov (ako sa zobrazujú v tabuľke na detaile školy) — potiahni za ⠿, alebo použi šípky.
      </div>
      <ul className="space-y-1.5">
        {items.map((o, index) => (
          <li
            key={o.id}
            draggable
            onDragStart={() => setDragId(o.id)}
            onDragEnd={() => { setDragId(null); setOverId(null); }}
            onDragOver={(e) => { e.preventDefault(); setOverId(o.id); }}
            onDrop={(e) => { e.preventDefault(); onDrop(o.id); }}
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
              overId === o.id && dragId !== o.id
                ? "border-slate-900 bg-slate-100"
                : "border-slate-200 bg-white"
            } ${dragId === o.id ? "opacity-50" : ""}`}
          >
            <span className="cursor-grab select-none text-slate-400" style={{ cursor: "grab" }} aria-hidden="true">⠿</span>
            <span className="w-5 flex-none text-xs text-slate-400">{index + 1}.</span>
            <span className="min-w-0 flex-1 truncate">
              {o.code && <span className="mr-1.5 font-mono text-xs text-slate-500">{o.code}</span>}
              {o.name || <span className="italic text-slate-400">(bez názvu)</span>}
            </span>
            <div className="flex flex-none gap-1">
              <button
                type="button"
                onClick={() => move(o.id, -1)}
                disabled={index === 0}
                className="rounded border border-slate-300 px-1.5 text-xs leading-5 hover:bg-slate-50 disabled:opacity-30"
                aria-label="Posunúť vyššie"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(o.id, 1)}
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
          {pending ? "Ukladám…" : "Uložiť poradie odborov"}
        </button>
      )}
      {saved && !orderChanged && (
        <span className="ml-3 text-sm text-emerald-600">Poradie uložené ✓</span>
      )}
    </div>
  );
}
