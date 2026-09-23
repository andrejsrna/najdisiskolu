"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type VeltrhSchool = { slug: string; name: string };

const VISIBLE_LIMIT = 6;

export default function VeltrhSchoolsList({ schools }: { schools: VeltrhSchool[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (schools.length === 0) return null;

  const visible = schools.slice(0, VISIBLE_LIMIT);
  const restCount = schools.length - visible.length;

  return (
    <>
      <div className="tags">
        {visible.map((s) => (
          <Link key={s.slug} href={`/skola/${s.slug}`} className="tag">
            {s.name}
          </Link>
        ))}
        {restCount > 0 && (
          <button type="button" className="tag tag-more" onClick={() => setOpen(true)}>
            +{restCount} ďalších
          </button>
        )}
      </div>

      {open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Zúčastnené školy"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <h3>Zúčastnené školy ({schools.length})</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Zavrieť">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="tags">
                {schools.map((s) => (
                  <Link key={s.slug} href={`/skola/${s.slug}`} className="tag" onClick={() => setOpen(false)}>
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
