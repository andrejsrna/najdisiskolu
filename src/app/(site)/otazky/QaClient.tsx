"use client";
import { useState } from "react";
import type { QAGroup } from "@/lib/qa-data";

export function QaClient({ qa }: { qa: QAGroup[] }) {
  const [q, setQ] = useState("");
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
        <div key={g}>
          <h3 style={{ fontSize: 22, letterSpacing: "-.02em", margin: "30px 0 6px" }}>{g}</h3>
          {items.map(([qq, aa]) => (
            <details key={qq} style={{ borderBottom: "1px solid var(--line2)", padding: "11px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 16 }}>{qq}</summary>
              <div
                style={{ paddingTop: 8, fontSize: 15, color: "var(--ink2)", maxWidth: "68ch" }}
                dangerouslySetInnerHTML={{ __html: aa }}
              />
            </details>
          ))}
        </div>
      ))}
    </>
  );
}
