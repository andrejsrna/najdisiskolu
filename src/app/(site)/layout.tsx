import type { ReactNode } from "react";
import Link from "next/link";
import { TTSK_HEADER_LOGO, TTSK_EMBLEM } from "@/lib/ttsk";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <nav className="nav">
        <Link href="/" className="logo" aria-label="Trnavský samosprávny kraj — Vyber si strednú">
          <span dangerouslySetInnerHTML={{ __html: TTSK_HEADER_LOGO }} />
        </Link>
        <Link href="/">Vyber si strednú</Link>
        <Link href="/veltrhy">Veľtrhy škôl</Link>
        <Link href="/otazky">Otázky a odpovede</Link>
        <Link href="/admin" className="right">
          Administrácia
        </Link>
      </nav>

      {children}

      <footer>
        <div className="wrap">
          <div className="cols">
            <div className="flogo" aria-label="Trnavský samosprávny kraj">
              <span dangerouslySetInnerHTML={{ __html: TTSK_EMBLEM }} />
            </div>
            <div>
              <b>Trnavský samosprávny kraj</b>
              <br />
              Odbor školstva
            </div>
            <div>
              Katalóg stredných škôl zriaďovaných Trnavským samosprávnym krajom.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
