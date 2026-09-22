import type { Metadata } from "next";
import { getSchoolsBySlugs } from "@/lib/school-query";
import { SchoolDetailView } from "../skola/[slug]/SchoolDetailView";
import { PrintAllButton } from "./PrintAllButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tlač vybraných škôl",
  robots: { index: false, follow: false },
};

export default async function TlacPage({
  searchParams,
}: {
  searchParams: Promise<{ skoly?: string }>;
}) {
  const { skoly } = await searchParams;
  const slugs = (skoly ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const schools = await getSchoolsBySlugs(slugs);

  if (schools.length === 0) {
    return (
      <div className="wrap" style={{ padding: "60px 30px" }}>
        <p>Nenašli sa žiadne školy na vytlačenie. Vráť sa na vyhľadávanie a skús to znova.</p>
      </div>
    );
  }

  return (
    <div className="print-batch">
      <div className="print-batch-toolbar no-print">
        <span>{schools.length} {schools.length === 1 ? "škola pripravená" : schools.length < 5 ? "školy pripravené" : "škôl pripravených"} na tlač</span>
        <PrintAllButton count={schools.length} />
      </div>
      {schools.map((school, i) => (
        <div className="print-batch-item" key={school.id} style={{ pageBreakAfter: i < schools.length - 1 ? "always" : "auto" }}>
          <SchoolDetailView school={school} printMode />
        </div>
      ))}
    </div>
  );
}
