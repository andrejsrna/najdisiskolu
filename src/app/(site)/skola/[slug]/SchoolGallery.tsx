"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

type Photo = { id: string; url: string; alt: string | null };

export function SchoolGallery({ photos, schoolName }: { photos: Photo[]; schoolName: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: photos.length > 1 });
  const [selected, setSelected] = useState(0);

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

  if (photos.length === 0) return null;

  return (
    <section aria-label={`Fotogaléria — ${schoolName}`} style={{ marginTop: 30 }}>
      <h2 className="dh">Fotogaléria</h2>
      <div className="overflow-hidden rounded-xl border border-black/10" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {photos.map((photo) => (
            <div className="min-w-0 flex-[0_0_100%]" key={photo.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt || schoolName}
                className="h-auto max-h-[520px] w-full object-cover"
              />
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
    </section>
  );
}