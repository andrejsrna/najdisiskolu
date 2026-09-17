"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Na každej zmeni cesty vráti stránku na vrchol – instantne,
 * aby to neskontrolovalo žiadny smooth scroll pri obnove skrolu v Next.js.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}