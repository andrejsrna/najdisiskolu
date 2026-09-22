"use client";

import { useEffect, useState } from "react";

type Image = { url: string; alt: string | null };

export default function ArticleGallery({ images, caption }: { images: Image[]; caption: string | null }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft") setActive((value) => value === null ? null : (value + images.length - 1) % images.length);
      if (event.key === "ArrowRight") setActive((value) => value === null ? null : (value + 1) % images.length);
    };
    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [active, images.length]);

  if (!images.length) return null;
  return (
    <>
      <div className="article-gallery">
        {images.map((image, index) => (
          <button type="button" key={image.url} onClick={() => setActive(index)} aria-label={`Zväčšiť fotku ${index + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt ?? "Fotografia k článku"} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
          </button>
        ))}
      </div>
      {caption && <p className="article-caption">{caption}</p>}
      {active !== null && (
        <div className="article-lightbox" role="dialog" aria-modal="true" aria-label="Náhľad fotografie" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
          <button type="button" className="article-lightbox-close" onClick={() => setActive(null)} aria-label="Zavrieť náhľad">×</button>
          {images.length > 1 && <button type="button" className="article-lightbox-prev" onClick={() => setActive((active + images.length - 1) % images.length)} aria-label="Predchádzajúca fotka">←</button>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[active].url} alt={images[active].alt ?? "Fotografia k článku"} decoding="async" />
          {images.length > 1 && <button type="button" className="article-lightbox-next" onClick={() => setActive((active + 1) % images.length)} aria-label="Ďalšia fotka">→</button>}
          <span className="article-lightbox-count">{active + 1} / {images.length}</span>
        </div>
      )}
    </>
  );
}
