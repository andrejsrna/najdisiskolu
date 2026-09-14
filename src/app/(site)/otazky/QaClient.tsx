"use client";
import { useState } from "react";
import type { QAGroup } from "@/lib/qa-data";

export function QaClient({ qa }: { qa: QAGroup[] }) {
  const [q, setQ] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set());
  const query = q.trim().toLowerCase();

  const filtered = qa
    .map(
      ([g, items]) =>
        [
          g,
          items.filter(
            ([qq, aa]) =>
              !query ||
              qq.toLowerCase().includes(query) ||
              aa.replace(/<[^>]+>/g, "").toLowerCase().includes(query),
          ),
        ] as [string, typeof items],
    )
    .filter(([, items]) => items.length);

  const total = filtered.reduce((a, [, i]) => a + i.length, 0);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hľadaj v otázkach — napríklad „prihláška“, „internát“, „duál“…"
          style={{ maxWidth: 480 }}
        />
      </div>

      {query && (
        <p style={{ color: "var(--ink2)", fontSize: 14, margin: "0 0 8px" }}>
          {total === 0
            ? "Nič sa nenašlo."
            : `Našli sme ${total} ${total === 1 ? "odpoveď" : total < 5 ? "odpovede" : "odpovedí"}.`}{" "}
          <button
            onClick={() => setQ("")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            Zrušiť hľadanie
          </button>
        </p>
      )}

      {filtered.length === 0 && !query && (
        <div className="empty">Zatiaľ tu nie sú žiadne otázky.</div>
      )}

      {filtered.map(([g, items]) => (
        <section className="qgroup" key={g} aria-labelledby={`faq-group-${g}`}>
          <h3 id={`faq-group-${g}`}>{g}</h3>
          {items.map(([qq, aa], index) => {
            const id = `${g}-${index}`;
            const open = openItems.has(id);
            return (
              <div className={`qa ${open ? "open" : ""}`} key={`${id}-${qq}`}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`faq-answer-${id}`}
                  onClick={() => {
                    setOpenItems((previous) => {
                      const next = new Set(previous);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                >
                  {qq}
                </button>
                <div
                  id={`faq-answer-${id}`}
                  className="ans"
                  dangerouslySetInnerHTML={{ __html: aa }}
                />
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
