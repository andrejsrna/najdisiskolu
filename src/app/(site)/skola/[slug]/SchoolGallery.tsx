"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

type Photo = { id: string; url: string; alt: string | null };

export function SchoolGallery({ photos, schoolName }: { photos: Photo[]; schoolName: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: photos.length > 1 });
  const [selected, setSelected] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") setLightboxIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length);
      if (event.key === "ArrowRight") setLightboxIndex((index) => index === null ? null : (index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex, photos.length]);

  if (photos.length === 0) return null;

  return (
    <section aria-label={`Fotogaléria — ${schoolName}`} style={{ marginTop: 30 }}>
      <h2 className="dh">Fotogaléria</h2>
      <div className="overflow-hidden rounded-xl border border-black/10" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {photos.map((photo, index) => (
            <div className="min-w-0 flex-[0_0_100%]" key={photo.id}>
              <button
                type="button"
                className="block w-full cursor-zoom-in"
                onClick={() => setLightboxIndex(index)}
                aria-label={`Zväčšiť fotku ${index + 1}: ${photo.alt || schoolName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt || schoolName}
                  className="h-auto max-h-[520px] w-full object-cover"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-label="Výber fotky">
            {photos.map((photo, i) => (
              <button
                type="button"
                key={photo.id}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Zobraziť fotku ${i + 1}`}
                aria-current={selected === i ? "true" : undefined}
                className={`h-2.5 w-2.5 rounded-full border border-black ${selected === i ? "bg-black" : "bg-white"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn sm" onClick={() => emblaApi?.scrollPrev()} aria-label="Predchádzajúca fotka">←</button>
            <button type="button" className="btn sm" onClick={() => emblaApi?.scrollNext()} aria-label="Nasledujúca fotka">→</button>
          </div>
        </div>
      )}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Zväčšená fotka ${lightboxIndex + 1} z ${photos.length}`}
          onClick={() => setLightboxIndex(null)}
        >
          <button type="button" className="absolute right-4 top-4 rounded border border-white px-3 py-1.5 text-lg text-white" onClick={() => setLightboxIndex(null)} aria-label="Zavrieť náhľad">×</button>
          {photos.length > 1 && (
            <button type="button" className="absolute left-4 rounded border border-white px-3 py-2 text-xl text-white" onClick={(event) => { event.stopPropagation(); setLightboxIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length); }} aria-label="Predchádzajúca fotka">←</button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIndex].url}
            alt={photos[lightboxIndex].alt || schoolName}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          {photos.length > 1 && (
            <button type="button" className="absolute right-4 rounded border border-white px-3 py-2 text-xl text-white" onClick={(event) => { event.stopPropagation(); setLightboxIndex((index) => index === null ? null : (index + 1) % photos.length); }} aria-label="Nasledujúca fotka">→</button>
          )}
        </div>
      )}
    </section>
  );
}