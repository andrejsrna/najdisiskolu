"use client";

export function PrintButton() {
  return (
    <button className="btn full" style={{ marginBottom: 10 }} onClick={() => window.print()}>
      🖨 Vytlačiť školu
    </button>
  );
}
