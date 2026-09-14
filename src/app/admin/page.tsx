import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

/** Prehľad bol duplicitný so Školami — nechávame iba Školy (s pásom čísel hore). */
export default async function AdminDashboard() {
  await requireUser();
  redirect("/admin/skoly");
}
