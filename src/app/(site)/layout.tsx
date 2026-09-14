import type { ReactNode } from "react";
import Link from "next/link";
import { TTSK_HEADER_LOGO, TTSK_EMBLEM } from "@/lib/ttsk";
import { Illustration } from "@/lib/illustrations";

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
        <div className="right">
          <a className="btn sm solid" href="https://eprihlasky.iedu.sk/" target="_blank" rel="noopener noreferrer">
            Prihláška →
          </a>
        </div>
      </nav>

      {children}

      <footer>
        <Illustration name="footerFootprint" />
        <div className="wrap">
          <div className="cols">
            <div className="flogo" aria-label="Trnavský samosprávny kraj">
              <span dangerouslySetInnerHTML={{ __html: TTSK_EMBLEM }} />
            </div>
            <div>
              <b>Trnavský samosprávny kraj</b>
              <br />
              Odbor školstva
              <br />
              Starohájska 10, 917 01 Trnava
              <br />
              <a href="mailto:podatelna@trnava-vuc.sk">podatelna@trnava-vuc.sk</a>
            </div>
            <div>
              Katalóg stredných škôl zriaďovaných Trnavským samosprávnym krajom.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 28px",
              marginTop: 28,
              fontSize: 13,
            }}
          >
            <a
              href="https://www.trnava-vuc.sk/kontakt/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kontakt
            </a>
            <a
              href="https://www.trnava-vuc.sk/ochrana-osobnych-udajov/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ochrana osobných údajov
            </a>
            <a
              href="https://www.trnava-vuc.sk/vyhlasenie-o-pristupnosti/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vyhlásenie o prístupnosti
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
