"use client";

export function PrintAllButton({ count }: { count: number }) {
  return (
    <button className="btn solid" onClick={() => window.print()}>
      🖨 Vytlačiť ({count})
    </button>
  );
}
