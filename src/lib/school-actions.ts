"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Role, type Completion } from "@/generated/prisma/enums";

const COMPLETION_VALUES = new Set([
  "MATURITA",
  "VYUCNY_LIST",
  "MATURITA_A_VYUCNY_LIST",
  "ZAVERECNA_SKUSKA",
]);

function revalidateSchool(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/skoly");
  revalidatePath(`/admin/skoly/${slug}`);
}

const str = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};
const num = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** ADMIN/SCHOLSTVO, alebo SKOLA ktorá edituje svoju školu. */
async function assertCanEditSchool(schoolId: string) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === Role.ADMIN || user.role === Role.SCHOLSTVO) return user;
  if (user.role === Role.SKOLA && user.schoolId === schoolId) return user;
  redirect("/admin");
}

/** Len ADMIN/SCHOLSTVO (napr. udeľovanie badge). */
async function assertSchoolAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");
  return user;
}

/* ================= ŠKOLA ================= */

export async function updateSchoolBasic(
  schoolId: string,
  slug: string,
  formData: FormData,
) {
  await assertCanEditSchool(schoolId);
  const tagCodes = formData.getAll("tags").map(String);

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      district: String(formData.get("district") ?? "").trim(),
      website: str(formData.get("website")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      facebook: str(formData.get("facebook")),
      instagram: str(formData.get("instagram")),
      address: str(formData.get("address")),
      mapUrl: str(formData.get("mapUrl")),
      inekoKraj: str(formData.get("inekoKraj")),
      inekoSlovensko: str(formData.get("inekoSlovensko")),
      totalStudents: str(formData.get("totalStudents")),
      intro: str(formData.get("intro")),
      accessibility: str(formData.get("accessibility")),
      internatInfo: str(formData.get("internatInfo")),
      erasmus: str(formData.get("erasmus")),
      hasInternat: formData.has("hasInternat"),
      hasCanteen: formData.has("hasCanteen"),
      hasDual: formData.has("hasDual"),
      hasNadstavba: formData.has("hasNadstavba"),
      hasNativeSpeaker: formData.has("hasNativeSpeaker"),
      tags: { set: tagCodes.map((code) => ({ code })) },
    },
  });
  revalidateSchool(slug);
}

/* ================= ODBOR (repeater) ================= */

export async function addOdbor(schoolId: string, slug: string, formData: FormData) {
  await assertCanEditSchool(schoolId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const completion = String(formData.get("completion") ?? "MATURITA");
  await prisma.odbor.create({
    data: {
      schoolId,
      code: str(formData.get("code")) ?? "",
      name,
      length: num(formData.get("length")) ?? 4,
      completion: (COMPLETION_VALUES.has(completion)
        ? completion
        : "MATURITA") as Completion,
      accepts: num(formData.get("accepts")),
      appliedLastYear: num(formData.get("appliedLastYear")),
      places: num(formData.get("places")),
      employment: str(formData.get("employment")),
    },
  });
  revalidateSchool(slug);
}

export async function updateOdbor(
  schoolId: string,
  slug: string,
  odborId: string,
  formData: FormData,
) {
  await assertCanEditSchool(schoolId);
  const completion = String(formData.get("completion") ?? "MATURITA");
  await prisma.odbor.update({
    where: { id: odborId },
    data: {
      code: str(formData.get("code")) ?? "",
      name: String(formData.get("name") ?? "").trim(),
      length: num(formData.get("length")) ?? 4,
      completion: (COMPLETION_VALUES.has(completion)
        ? completion
        : "MATURITA") as Completion,
      accepts: num(formData.get("accepts")),
      appliedLastYear: num(formData.get("appliedLastYear")),
      places: num(formData.get("places")),
      employment: str(formData.get("employment")),
    },
  });
  revalidateSchool(slug);
}

export async function deleteOdbor(
  schoolId: string,
  slug: string,
  odborId: string,
) {
  await assertCanEditSchool(schoolId);
  await prisma.odbor.delete({ where: { id: odborId } });
  revalidateSchool(slug);
}

/* ================= DOD ================= */

export async function saveDod(schoolId: string, slug: string, formData: FormData) {
  await assertCanEditSchool(schoolId);
  const dateStr = str(formData.get("date"));
  const time = str(formData.get("time"));
  const existing = await prisma.dod.findFirst({ where: { schoolId } });

  if (!dateStr) {
    // prázdny dátum → zmazať DOD
    if (existing) await prisma.dod.delete({ where: { id: existing.id } });
  } else {
    const date = new Date(`${dateStr}T00:00:00`);
    if (existing) {
      await prisma.dod.update({ where: { id: existing.id }, data: { date, time } });
    } else {
      await prisma.dod.create({ data: { schoolId, date, time } });
    }
  }
  revalidateSchool(slug);
}

/* ================= DOWNLOAD ================= */

export async function addDownload(schoolId: string, slug: string, formData: FormData) {
  await assertCanEditSchool(schoolId);
  const title = str(formData.get("title"));
  const fileUrl = str(formData.get("fileUrl"));
  if (!title || !fileUrl) return;
  await prisma.download.create({
    data: { schoolId, title, fileUrl, fileName: str(formData.get("fileName")) },
  });
  revalidateSchool(slug);
}

export async function deleteDownload(
  schoolId: string,
  slug: string,
  downloadId: string,
) {
  await assertCanEditSchool(schoolId);
  await prisma.download.delete({ where: { id: downloadId } });
  revalidateSchool(slug);
}

/* ================= BADGE (len ADMIN/SCHOLSTVO) ================= */

export async function addBadge(schoolId: string, slug: string, formData: FormData) {
  await assertSchoolAdmin();
  const label = str(formData.get("label"));
  if (!label) return;
  await prisma.badge.create({
    data: {
      schoolId,
      label,
      kind: str(formData.get("kind")) ?? "ok",
      note: str(formData.get("note")),
    },
  });
  revalidateSchool(slug);
}

export async function deleteBadge(schoolId: string, slug: string, badgeId: string) {
  await assertSchoolAdmin();
  await prisma.badge.delete({ where: { id: badgeId } });
  revalidateSchool(slug);
}
