"use client";

import { useRef, useState } from "react";
import { uploadPostImages } from "@/lib/admin-actions";

const ACCEPT = "image/jpeg,image/png,image/webp";

export function CoverImageUpload({ name, initial }: { name: string; initial: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initial);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAndSync = (value: string) => {
    setUrl(value);
    if (hiddenRef.current) hiddenRef.current.value = value;
  };

  const upload = async (file: File) => {
    const form = new FormData();
    form.append("files", file);
    setBusy(true);
    setError(null);
    try {
      const urls = await uploadPostImages(form);
      if (urls.length) setAndSync(urls[0]);
      else setError("Fotografia sa nenahrala — skontroluj formát/veľkosť.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nahrávanie zlyhalo.");
    } finally {
      setBusy(false);
    }
  };

  const pick = (list: FileList | File[]) => {
    const file = Array.from(list).find((f) => f.size > 0);
    if (file) upload(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={initial}
        aria-hidden="true"
        tabIndex={-1}
      />

      {url ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Titulná fotografia"
            className="h-24 w-40 shrink-0 rounded-lg border border-slate-200 object-cover"
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500">Nahraná titulná fotografia</span>
            <button
              type="button"
              onClick={() => setAndSync("")}
              className="self-start rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Odstrániť
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Nahraj titulnú fotografiu drag & drop alebo kliknutím"
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
            pick(e.dataTransfer.files);
          }}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition ${
            drag ? "border-slate-900 bg-slate-50" : "border-slate-300"
          }`}
        >
          <div className="text-sm font-medium text-slate-700">
            {busy ? "Nahrávam…" : drag ? "Pusti fotografiu sem…" : "Pretiahni titulnú fotografiu sem alebo klikni"}
          </div>
          <div className="mt-1 text-xs text-slate-500">JPEG, PNG alebo WebP, max 10 MB.</div>
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => e.target.files && pick(e.target.files)} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setAndSync(e.target.value)}
          placeholder="…alebo vlož URL titulnej fotografie"
          className="block w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}