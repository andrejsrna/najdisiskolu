"use client";

import { useRef, useState } from "react";
import { uploadPostImages } from "@/lib/admin-actions";

type Item = { url: string; alt: string | null };

const ACCEPT = "image/jpeg,image/png,image/webp";

const serialized = (items: Item[]) =>
  items.map((i) => (i.alt ? `${i.url} | ${i.alt}` : i.url)).join("\n");

export function BlogGalleryUpload({ initial }: { initial: Item[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLTextAreaElement>(null);
  const [items, setItems] = useState<Item[]>(initial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pendUrls, setPendUrls] = useState<string[]>([]); // preview objectURLs, parallel to pendFiles
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setAndSync = (next: Item[]) => {
    setItems(next);
    if (hiddenRef.current) hiddenRef.current.value = serialized(next);
  };

  const addFiles = (list: FileList | File[]) => {
    const next = Array.from(list).filter((f) => f.size > 0).slice(0, 20 - items.length);
    if (!next.length) return;
    setPendUrls((p) => [...p, ...next.map((f) => URL.createObjectURL(f))]);
    setError(null);
  };

  const uploadPending = async () => {
    if (!pendUrls.length || busy) return;
    const input = inputRef.current;
    setBusy(true);
    setError(null);
    try {
      const fileInput = input as HTMLInputElement;
      const files = fileInput.files ? Array.from(fileInput.files).filter((f) => f.size > 0) : [];
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const urls = await uploadPostImages(form);
      if (urls.length === 0) setError("Žiadna fotografia sa nenahrala — skontroluj formát/veľkosť.");
      else setAndSync([...items, ...urls.map((url) => ({ url, alt: null }))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nahrávanie zlyhalo.");
    } finally {
      pendUrls.forEach((u) => URL.revokeObjectURL(u));
      if (input) input.value = "";
      setPendUrls([]);
      setBusy(false);
    }
  };

  const removePending = (objectUrl: string) => {
    URL.revokeObjectURL(objectUrl);
    setPendUrls((p) => p.filter((u) => u !== objectUrl));
  };

  const removeItem = (index: number) => setAndSync(items.filter((_, i) => i !== index));
  const setAlt = (index: number, alt: string) => {
    const next = items.map((it, i) => (i === index ? { ...it, alt } : it));
    setAndSync(next);
  };

  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setAndSync(next);
  };

  const thumb = (url: string, key: string, isPending: boolean, item?: Item, index?: number) => (
    <div
      key={key}
      draggable={!isPending}
      onDragStart={(e) => {
        setDragIndex(index ?? 0);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (dragIndex !== null) moveItem(dragIndex, index ?? 0);
        setDragIndex(null);
      }}
      onDragEnd={() => setDragIndex(null)}
      className={`group relative overflow-hidden rounded-lg border border-slate-200 bg-white ${
        !isPending && dragIndex === index ? "opacity-50" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="aspect-square h-auto w-full object-cover" />
      {isPending ? (
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">nová</span>
      ) : (
        <input
          value={item?.alt ?? ""}
          onChange={(e) => setAlt(index!, e.target.value)}
          placeholder="popis"
          className="w-full border-t border-slate-200 px-1.5 py-1 text-[11px] text-slate-600 outline-none placeholder:text-slate-300"
        />
      )}
      <button
        type="button"
        aria-label="Odstrániť fotku"
        onClick={() => (isPending ? removePending(url) : removeItem(index!))}
        className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-white hover:bg-black"
      >
        ×
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      <textarea
        ref={hiddenRef}
        name="galleryImages"
        className="hidden"
        defaultValue={serialized(initial)}
        readOnly
        aria-hidden="true"
        tabIndex={-1}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Nahraj fotky drag & drop alebo kliknutím"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
          if (e.dataTransfer.files.length) {
            const dt = new DataTransfer();
            Array.from(e.dataTransfer.files).forEach((f) => f.size > 0 && dt.items.add(f));
            if (inputRef.current) inputRef.current.files = dt.files;
          }
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
          drag ? "border-slate-900 bg-slate-50" : "border-slate-300"
        }`}
      >
        <div className="text-sm font-medium text-slate-700">
          {drag ? "Pusti fotky sem…" : "Pretiahni sem fotky alebo klikni pre výber"}
        </div>
        <div className="mt-1 text-xs text-slate-500">JPEG, PNG alebo WebP, max 10 MB. Môžeš ich pridať viac naraz.</div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files ?? [])}
        />
      </div>

      {pendUrls.length > 0 && (
        <button
          type="button"
          onClick={uploadPending}
          disabled={busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? "Nahrávam…" : `Nahrať ${pendUrls.length} ${pendUrls.length === 1 ? "fotku" : pendUrls.length < 5 ? "fotky" : "fotiek"}`}
        </button>
      )}

      {(pendUrls.length > 0 || items.length > 0) && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {pendUrls.map((u) => thumb(u, `p-${u}`, true))}
          {items.map((it, i) => thumb(it.url, `i-${it.url}-${i}`, false, it, i))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="url"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="…alebo vlož URL fotky manuálne"
          className="block w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const url = manualUrl.trim();
            if (!url) return;
            setAndSync([...items, { url, alt: null }]);
            setManualUrl("");
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Pridať
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}