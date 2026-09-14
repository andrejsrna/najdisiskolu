"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { uploadPublicImage } from "@/lib/s3";
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
  revalidatePath("/");
  revalidatePath(`/skola/${slug}`);
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

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

async function assertSupportedImage(file: File) {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Fotka musí byť vo formáte JPEG, PNG alebo WebP.");
  }
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Fotka môže mať najviac 10 MB.");
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.slice(0, 8).every((byte, index) => byte === pngHeader[index]);
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    throw new Error("Súbor neobsahuje platné obrazové dáta.");
  }
}

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
  const priestoryIds = formData.getAll("priestory").map(String);
  const languageCodes = formData.getAll("languages").map(String);
  const csv = (k: string) =>
    String(formData.get(k) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      district: String(formData.get("district") ?? "").trim(),
      languages: languageCodes,
      foreignLanguages: csv("foreignLanguages"),
      supportTeam: csv("supportTeam"),
      websites: String(formData.get("websites") ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""))
        .filter(Boolean),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      facebook: str(formData.get("facebook"))
        ?.replace(/^@/, "")
        .replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, ""),
      instagram: str(formData.get("instagram"))
        ?.replace(/^@/, "")
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, ""),
      address: str(formData.get("address")),
      mapUrl: str(formData.get("mapUrl")),
      inekoKrajRank: num(formData.get("inekoKrajRank")),
      inekoKrajOf: str(formData.get("inekoKrajOf")),
      inekoSkRank: num(formData.get("inekoSkRank")),
      inekoSkOf: str(formData.get("inekoSkOf")),
      totalStudents: str(formData.get("totalStudents")),
      intro: str(formData.get("intro")),
      accessibility: str(formData.get("accessibility")),
      internatType: str(formData.get("internatType")),
      internatInfo: str(formData.get("internatInfo")),
      erasmus: str(formData.get("erasmus")),
      erasmusCountries: formData.getAll("erasmusCountries").map(String).filter((c) => c && c !== "Žiadne"),
      hasMaturita: formData.has("hasMaturita"),
      hasVl: formData.has("hasVl"),
      hasInternat: formData.has("hasInternat"),
      hasCanteen: formData.has("hasCanteen"),
      hasDual: formData.has("hasDual"),
      hasNadstavba: formData.has("hasNadstavba"),
      hasNativeSpeaker: formData.has("hasNativeSpeaker"),
      tags: { set: tagCodes.map((code) => ({ code })) },
      priestory: { set: priestoryIds.map((id) => ({ id })) },
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

/* ================= FOTOGALÉRIA ================= */

export async function addSchoolPhoto(schoolId: string, slug: string, formData: FormData) {
  await assertCanEditSchool(schoolId);
  const upload = formData.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  const fallbackUrl = str(formData.get("url"));
  if (!file && !fallbackUrl) return;

  let url = fallbackUrl;
  if (file) {
    await assertSupportedImage(file);
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    url = await uploadPublicImage(file, `skoly/${schoolId}/${crypto.randomUUID()}.${extension}`);
  }

  const sort = (await prisma.schoolPhoto.count({ where: { schoolId } })) + 1;
  await prisma.schoolPhoto.create({
    data: { schoolId, url: url!, alt: str(formData.get("alt")), sort },
  });
  revalidateSchool(slug);
}

export async function deleteSchoolPhoto(schoolId: string, slug: string, photoId: string) {
  await assertCanEditSchool(schoolId);
  await prisma.schoolPhoto.deleteMany({ where: { id: photoId, schoolId } });
  revalidateSchool(slug);
}

export async function setSchoolPhotoCover(
  schoolId: string,
  slug: string,
  photoId: string,
  kind: "detail" | "list",
) {
  await assertCanEditSchool(schoolId);
  const photo = await prisma.schoolPhoto.findFirst({ where: { id: photoId, schoolId } });
  if (!photo) return;
  const field = kind === "detail" ? "isDetailCover" : "isListCover";
  await prisma.$transaction([
    prisma.schoolPhoto.updateMany({ where: { schoolId }, data: { [field]: false } }),
    prisma.schoolPhoto.update({ where: { id: photoId }, data: { [field]: true } }),
  ]);
  revalidateSchool(slug);
}

/* ================= PODOBNÉ ŠKOLY (len ADMIN + SCHOLSTVO) ================= */

export async function saveSimilarSchools(schoolId: string, slug: string, formData: FormData) {
  await assertSchoolAdmin();
  const ids = [...new Set(formData.getAll("similarSchools").map(String))]
    .filter((id) => id !== schoolId)
    .slice(0, 3);
  await prisma.school.update({
    where: { id: schoolId },
    data: { similarTo: { set: ids.map((id) => ({ id })) } },
  });
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
