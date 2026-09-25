"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { compressAndUploadImage } from "@/lib/image";
import { logAudit } from "@/lib/audit";
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

// Handle sociálnej siete (facebook/instagram) musí vyzerať ako handle/URL —
// nesmie obsahovať medzery ani byť len "0"/"."/"-" apod. (poškodené dáta zo starých importov).
const INVALID_SOCIAL_VALUES = new Set(["0", ".", "-", "n/a", "na", "nema", "neni", "žiadny", "ziadny"]);
const socialHandle = (v: FormDataEntryValue | null): string | null => {
  const s = str(v);
  if (!s) return null;
  if (/\s/.test(s)) return null;
  if (INVALID_SOCIAL_VALUES.has(s.toLowerCase())) return null;
  return s;
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
  const actor = await assertCanEditSchool(schoolId);
  const tagCodes = formData.getAll("tags").map(String);
  const languageCodes = formData.getAll("languages").map(String);
  const csv = (k: string) =>
    String(formData.get(k) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  // Pre polia z TagListEditor (hodnoty môžu samy obsahovať čiarku, napr. "Firma, spol. s.r.o.")
  const lines = (k: string) =>
    String(formData.get(k) ?? "")
      .split("\n")
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
      whyUs: String(formData.get("whyUs") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
      certificates: csv("certificates"),
      clubs: csv("clubs"),
      sports: csv("sports"),
      canteenOptions: csv("canteenOptions"),
      dualCompanies: lines("dualCompanies"),
      websites: String(formData.get("websites") ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""))
        .filter(Boolean),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      facebook: socialHandle(formData.get("facebook"))
        ?.replace(/^@/, "")
        .replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, "") ?? null,
      instagram: socialHandle(formData.get("instagram"))
        ?.replace(/^@/, "")
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "") ?? null,
      address: str(formData.get("address")),
      mapUrl: str(formData.get("mapUrl")),
      inekoKrajRank: num(formData.get("inekoKrajRank")),
      inekoKrajOf: str(formData.get("inekoKrajOf")),
      inekoSkRank: num(formData.get("inekoSkRank")),
      inekoSkOf: str(formData.get("inekoSkOf")),
      totalStudents: str(formData.get("totalStudents")),
      intro: str(formData.get("intro")),
      partners: str(formData.get("partners")),
      modernization: str(formData.get("modernization")),
      graduates: str(formData.get("graduates")),
      achievements: str(formData.get("achievements")),
      practice: str(formData.get("practice")),
      dualInfo: str(formData.get("dualInfo")),
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
    },
  });
  await logAudit(actor, "update", "School", schoolId, String(formData.get("name") ?? slug));
  revalidateSchool(slug);
}

/* ================= ODBOR (repeater) ================= */

export async function addOdbor(schoolId: string, slug: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const completion = String(formData.get("completion") ?? "MATURITA");
  const maxSort = await prisma.odbor.aggregate({ where: { schoolId }, _max: { sort: true } });
  const odbor = await prisma.odbor.create({
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
      sort: (maxSort._max.sort ?? 0) + 1,
    },
  });
  await logAudit(actor, "create", "Odbor", odbor.id, name);
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
  const actor = await assertCanEditSchool(schoolId);
  await prisma.odbor.delete({ where: { id: odborId } });
  await logAudit(actor, "delete", "Odbor", odborId);
  revalidateSchool(slug);
}

export async function reorderOdbory(schoolId: string, slug: string, odborIds: string[]) {
  await assertCanEditSchool(schoolId);
  await prisma.$transaction(
    odborIds.map((id, index) =>
      prisma.odbor.updateMany({ where: { id, schoolId }, data: { sort: index + 1 } }),
    ),
  );
  revalidateSchool(slug);
}

/* ================= DOD ================= */

export async function addDod(schoolId: string, slug: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const dateStr = str(formData.get("date"));
  const time = str(formData.get("time"));
  const note = str(formData.get("note"));
  if (!dateStr) return;
  const date = new Date(`${dateStr}T00:00:00`);
  const dod = await prisma.dod.create({ data: { schoolId, date, time, note } });
  await logAudit(actor, "create", "Dod", dod.id, dateStr);
  revalidateSchool(slug);
}

export async function updateDod(schoolId: string, slug: string, dodId: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const dateStr = str(formData.get("date"));
  const time = str(formData.get("time"));
  const note = str(formData.get("note"));
  if (!dateStr) return;
  const date = new Date(`${dateStr}T00:00:00`);
  await prisma.dod.updateMany({ where: { id: dodId, schoolId }, data: { date, time, note } });
  await logAudit(actor, "update", "Dod", dodId, dateStr);
  revalidateSchool(slug);
}

export async function deleteDod(schoolId: string, slug: string, dodId: string) {
  const actor = await assertCanEditSchool(schoolId);
  await prisma.dod.deleteMany({ where: { id: dodId, schoolId } });
  await logAudit(actor, "delete", "Dod", dodId);
  revalidateSchool(slug);
}

/* ================= DOWNLOAD ================= */

export async function addDownload(schoolId: string, slug: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const title = str(formData.get("title"));
  const fileUrl = str(formData.get("fileUrl"));
  if (!title || !fileUrl) return;
  const download = await prisma.download.create({
    data: { schoolId, title, fileUrl, fileName: str(formData.get("fileName")) },
  });
  await logAudit(actor, "create", "Download", download.id, title);
  revalidateSchool(slug);
}

export async function deleteDownload(
  schoolId: string,
  slug: string,
  downloadId: string,
) {
  const actor = await assertCanEditSchool(schoolId);
  await prisma.download.delete({ where: { id: downloadId } });
  await logAudit(actor, "delete", "Download", downloadId);
  revalidateSchool(slug);
}

/* ================= PROJEKTY ŠKOLY ================= */

export async function addProject(schoolId: string, slug: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const title = str(formData.get("title"));
  const description = str(formData.get("description"));
  if (!title || !description) return;
  const sort = (await prisma.project.count({ where: { schoolId } })) + 1;
  const project = await prisma.project.create({ data: { schoolId, title, description, sort } });
  await logAudit(actor, "create", "Project", project.id, title);
  revalidateSchool(slug);
}

export async function updateProject(schoolId: string, slug: string, projectId: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const title = str(formData.get("title"));
  const description = str(formData.get("description"));
  if (!title || !description) return;
  await prisma.project.updateMany({ where: { id: projectId, schoolId }, data: { title, description } });
  await logAudit(actor, "update", "Project", projectId, title);
  revalidateSchool(slug);
}

export async function deleteProject(schoolId: string, slug: string, projectId: string) {
  const actor = await assertCanEditSchool(schoolId);
  await prisma.project.deleteMany({ where: { id: projectId, schoolId } });
  await logAudit(actor, "delete", "Project", projectId);
  revalidateSchool(slug);
}

/* ================= FOTOGALÉRIA ================= */

export async function addSchoolPhoto(schoolId: string, slug: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const upload = formData.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  const fallbackUrl = str(formData.get("url"));
  if (!file && !fallbackUrl) return null;

  let url = fallbackUrl;
  if (file) {
    await assertSupportedImage(file);
    url = await compressAndUploadImage(file, `skoly/${schoolId}/${crypto.randomUUID()}`);
  }

  const sort = (await prisma.schoolPhoto.count({ where: { schoolId } })) + 1;
  const photo = await prisma.schoolPhoto.create({
    data: { schoolId, url: url!, alt: str(formData.get("alt")), sort },
    select: { id: true, url: true, alt: true, isDetailCover: true, isListCover: true, focalX: true, focalY: true },
  });
  await logAudit(actor, "create", "SchoolPhoto", photo.id, schoolId);
  revalidateSchool(slug);
  return photo;
}

export async function addSchoolPhotos(schoolId: string, slug: string, formData: FormData) {
  const actor = await assertCanEditSchool(schoolId);
  const files = formData
    .getAll("files")
    .filter((x): x is File => x instanceof File && x.size > 0);
  if (files.length === 0) return;
  const baseSort = await prisma.schoolPhoto.count({ where: { schoolId } });
  const rows: { schoolId: string; url: string; alt: null; sort: number }[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    await assertSupportedImage(file);
    const url = await compressAndUploadImage(file, `skoly/${schoolId}/${crypto.randomUUID()}`);
    rows.push({ schoolId, url, alt: null, sort: baseSort + i + 1 });
  }
  await prisma.schoolPhoto.createMany({ data: rows });
  await logAudit(actor, "create", "SchoolPhoto", schoolId, `${rows.length} fotiek`);
  revalidateSchool(slug);
}

export async function reorderSchoolPhotos(schoolId: string, slug: string, photoIds: string[]) {
  await assertCanEditSchool(schoolId);
  await prisma.$transaction(
    photoIds.map((id, index) =>
      prisma.schoolPhoto.updateMany({ where: { id, schoolId }, data: { sort: index + 1 } }),
    ),
  );
  revalidateSchool(slug);
}

export async function deleteSchoolPhoto(schoolId: string, slug: string, photoId: string) {
  const actor = await assertCanEditSchool(schoolId);
  await prisma.schoolPhoto.deleteMany({ where: { id: photoId, schoolId } });
  await logAudit(actor, "delete", "SchoolPhoto", photoId, schoolId);
  revalidateSchool(slug);
}

export async function updateSchoolPhotoFocal(
  schoolId: string,
  slug: string,
  photoId: string,
  formData: FormData,
) {
  await assertCanEditSchool(schoolId);
  const focal = (key: string) => Math.max(0, Math.min(100, Number(formData.get(key)) || 50));
  await prisma.schoolPhoto.updateMany({
    where: { id: photoId, schoolId },
    data: { focalX: focal("focalX"), focalY: focal("focalY") },
  });
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
  const actor = await assertSchoolAdmin();
  const ids = [...new Set(formData.getAll("similarSchools").map(String))]
    .filter((id) => id !== schoolId)
    .slice(0, 3);
  await prisma.school.update({
    where: { id: schoolId },
    data: { similarTo: { set: ids.map((id) => ({ id })) } },
  });
  await logAudit(actor, "update", "School", schoolId, "Podobné školy");
  revalidateSchool(slug);
}

/* ================= BADGE (len ADMIN/SCHOLSTVO) ================= */

export async function addBadge(schoolId: string, slug: string, formData: FormData) {
  const actor = await assertSchoolAdmin();
  const label = str(formData.get("label"));
  if (!label) return;
  const badge = await prisma.badge.create({
    data: {
      schoolId,
      label,
      kind: str(formData.get("kind")) ?? "ok",
      note: str(formData.get("note")),
    },
  });
  await logAudit(actor, "create", "Badge", badge.id, label);
  revalidateSchool(slug);
}

export async function deleteBadge(schoolId: string, slug: string, badgeId: string) {
  const actor = await assertSchoolAdmin();
  await prisma.badge.delete({ where: { id: badgeId } });
  await logAudit(actor, "delete", "Badge", badgeId);
  revalidateSchool(slug);
}
