"use client";

import { useEffect } from "react";

export function PrintAllButton({ count }: { count: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <button className="btn solid" onClick={() => window.print()}>
      🖨 Vytlačiť ({count})
    </button>
  );
}
