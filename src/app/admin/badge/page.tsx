import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

/** Odznaky boli zrušené — adminujú sa v Highlightoch školy. */
export default async function BadgePage() {
  await requireUser();
  redirect("/admin/skoly");
}
