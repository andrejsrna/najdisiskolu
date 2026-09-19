"use client";

import { useRef, useState } from "react";
import { addSchoolPhoto } from "@/lib/school-actions";

const ACCEPT = "image/jpeg,image/png,image/webp";

function readPreviewURL(file: File) {
  return URL.createObjectURL(file);
}

export function PhotoUpload({ schoolId, slug }: { schoolId: string; slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (list: FileList | File[]) => {
    const next = [...Array.from(list)].filter((f) => f.size > 0).slice(0, 20 - files.length);
    if (!next.length) return;
    setFiles((prev) => [...prev, ...next].slice(0, 20));
    setPreviews((prev) => [...prev, ...next.map(readPreviewURL)].slice(0, 20));
    setError(null);
  };

  const upload = () => {
    if (!files.length || pending) return;
    const queuedFiles = [...files];
    const queuedPreviews = [...previews];
    setPending(true);
    setError(null);
    void (async () => {
      const failedFiles: File[] = [];
      const failedPreviews: string[] = [];
      const errors: string[] = [];

      // Jeden súbor = jeden Server Action request. Pri výbere viacerých
      // fotiek tak neprekročíme Next.js limit tela požiadavky.
      for (const [index, file] of queuedFiles.entries()) {
        try {
          const form = new FormData();
          form.append("file", file);
          const photo = await addSchoolPhoto(schoolId, slug, form);
          if (!photo) throw new Error("Fotka sa nepodarila spracovať.");
          URL.revokeObjectURL(queuedPreviews[index]);
          window.dispatchEvent(new CustomEvent("school-photo-uploaded", { detail: photo }));
        } catch (e) {
          failedFiles.push(file);
          failedPreviews.push(queuedPreviews[index]);
          errors.push(e instanceof Error ? e.message : `${file.name}: nahrávanie zlyhalo.`);
        }
      }

      setFiles(failedFiles);
      setPreviews(failedPreviews);
      if (inputRef.current) inputRef.current.value = "";
      if (errors.length) setError(errors.join(" "));
      setPending(false);
    })();
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
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
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
          drag ? "border-slate-900 bg-slate-50" : "border-slate-300"
        }`}
      >
        <div className="text-sm font-medium text-slate-700">
          {drag ? "Pusti fotky sem…" : "Pretiahni sem fotky alebo klikni pre výber"}
        </div>
        <div className="mt-1 text-xs text-slate-500">JPEG, PNG alebo WebP, max 10 MB za fotku. Môžeš ich pridať viac naraz.</div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {previews.map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Fotka ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Odstrániť fotku ${i + 1}`}
                  onClick={() => removeFile(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-white hover:bg-black"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={upload}
              disabled={pending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {pending ? "Nahrávam…" : `Nahrať ${files.length} ${files.length === 1 ? "fotku" : files.length < 5 ? "fotky" : "fotiek"}`}
            </button>
            <button
              type="button"
              onClick={() => {
                previews.forEach((u) => URL.revokeObjectURL(u));
                setFiles([]);
                setPreviews([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Zrušiť
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}