import type { ReactNode } from "react";
import Link from "next/link";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <nav className="nav">
        <Link href="/" className="logo">
          Najdi si školu
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
            <div className="flogo">
              <b>Najdi si školu</b>
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
