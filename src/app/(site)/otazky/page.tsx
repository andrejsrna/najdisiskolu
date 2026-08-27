import { QA } from "@/lib/qa-data";
import { QaClient } from "./QaClient";

export default function OtazkyPage() {
  return (
    <>
      <section className="band-mat">
        <div className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <h1 style={{ fontSize: "clamp(30px,4.5vw,54px)", letterSpacing: "-.03em", margin: 0 }}>
            Otázky a odpovede
          </h1>
          <p style={{ fontSize: 19, maxWidth: "62ch", margin: "12px 0 0", color: "var(--ink)", opacity: 0.8 }}>
            Všetko, čo sa deviataci a ich rodičia pýtajú najčastejšie — od prihlášky po prvý
            september.
          </p>
        </div>
      </section>

      <section className="band-page">
        <div className="wrap" style={{ paddingTop: 36, paddingBottom: 56 }}>
          <QaClient qa={QA} />
        </div>
      </section>
    </>
  );
}
