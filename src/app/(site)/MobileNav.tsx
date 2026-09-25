"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Mobilné navigačné menu — pod breakpointom (.nav-links a .right sa skryjú
 * cez CSS) sa zobrazí hamburger tlačidlo, ktoré rozbaľuje odkazy do
 * vertikálneho panelu namiesto toho, aby sa nepekne zalomili na 2 riadky.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "Zavrieť menu" : "Otvoriť menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`nav-toggle-bars${open ? " open" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>
      <div className={`nav-panel${open ? " open" : ""}`}>
        <Link href="/" onClick={() => setOpen(false)}>
          Vyber si strednú
        </Link>
        <Link href="/veltrhy" onClick={() => setOpen(false)}>
          Veľtrhy škôl
        </Link>
        <Link href="/otazky" onClick={() => setOpen(false)}>
          Otázky a odpovede
        </Link>
        <a
          className="btn sm solid"
          href="https://eprihlasky.iedu.sk/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
        >
          Prihláška →
        </a>
      </div>
    </>
  );
}
