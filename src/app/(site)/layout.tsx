import type { ReactNode } from "react";
import Link from "next/link";
import { TTSK_HEADER_LOGO, TTSK_EMBLEM } from "@/lib/ttsk";
import { Illustration } from "@/lib/illustrations";
import { ScrollToTop } from "./ScrollToTop";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <ScrollToTop />
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
              Starohájska 10, Trnava
            </div>
            <div>
              <Link href="/">Vyber si strednú</Link>
              <br />
              <Link href="/veltrhy">Veľtrhy škôl</Link>
              <br />
              <Link href="/otazky">Otázky a odpovede</Link>
            </div>
            <div>
              <a
                href="https://www.trnava-vuc.sk/vyhlasenie-o-pristupnosti/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vyhlásenie o prístupnosti
              </a>
              <br />
              <a
                href="https://www.trnava-vuc.sk/ochrana-osobnych-udajov/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ochrana osobných údajov
              </a>
              <br />
              <Link href="/admin">
                <b>Prihlásenie pre školy →</b>
              </Link>
            </div>
          </div>
        </div>
        <div className="wrap">
          <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "1.5rem", lineHeight: 1.5 }}>
            Nota bene: Informácie na tomto webe majú informatívny a orientačný charakter. Slúžia ako pomôcka pre
            žiakov a rodičov. Za prípadné nepresnosti alebo neaktuálnosť údajov nenesie Trnavský samosprávny kraj
            zodpovednosť. V prípade rozdielu medzi informáciami na tomto webe a oficiálnymi informáciami školy sú
            rozhodujúce údaje zverejnené školou na jej oficiálnom webovom sídle.
          </p>
        </div>
      </footer>
    </div>
  );
}
