"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Role, PostType } from "@/generated/prisma/enums";
import { parseRole, canManageRole } from "@/lib/roles";

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

async function assertStaff() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");
  return user;
}

/* ================= TAGY ================= */

export async function addTag(formData: FormData) {
  await assertStaff();
  const code = str(formData.get("code"))?.toLowerCase();
  const label = str(formData.get("label"));
  if (!code || !label) return;
  await prisma.tag.upsert({ where: { code }, update: { label }, create: { code, label } });
  revalidatePath("/admin/tagy");
}

export async function deleteTag(id: string) {
  await assertStaff();
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tagy");
}

/* ================= PRIESTORY ================= */

export async function addPriestor(formData: FormData) {
  await assertStaff();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.priestor.create({ data: { name } });
  revalidatePath("/admin/priestory");
}

export async function deletePriestor(id: string) {
  await assertStaff();
  await prisma.priestor.delete({ where: { id } });
  revalidatePath("/admin/priestory");
}

/* ================= VEĽTRHY ================= */

export async function addVeltrh(formData: FormData) {
  await assertStaff();
  const city = str(formData.get("city"));
  const dateStr = str(formData.get("date"));
  if (!city || !dateStr) return;
  await prisma.veltrh.create({
    data: {
      city,
      date: new Date(`${dateStr}T00:00:00`),
      time: str(formData.get("time")) ?? "",
      place: str(formData.get("place")) ?? "",
      address: str(formData.get("address")) ?? "",
      description: str(formData.get("description")),
      extra: str(formData.get("extra")),
    },
  });
  revalidatePath("/admin/veltrhy");
}

export async function deleteVeltrh(id: string) {
  await assertStaff();
  await prisma.veltrh.delete({ where: { id } });
  revalidatePath("/admin/veltrhy");
}

export async function setVeltrhSchools(veltrhId: string, formData: FormData) {
  await assertStaff();
  const schoolIds = formData.getAll("schools").map(String);
  await prisma.veltrh.update({
    where: { id: veltrhId },
    data: { schools: { set: schoolIds.map((id) => ({ id })) } },
  });
  revalidatePath("/admin/veltrhy");
}

/* ================= BLOG ================= */

export async function savePost(formData: FormData) {
  await assertStaff();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  if (!title) return;
  const data = {
    title,
    type: PostType.NEWS,
    body: str(formData.get("body")) ?? "",
    coverUrl: str(formData.get("coverUrl")),
    schoolId: null,
    published: formData.has("published"),
    publishedAt: formData.has("published") ? new Date() : null,
  };
  if (id) {
    await prisma.post.update({ where: { id }, data });
  } else {
    await prisma.post.create({ data });
  }
  revalidatePath("/admin/blog");
}

export async function deletePost(id: string) {
  await assertStaff();
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/blog");
}

/* ================= RECENZIE (príbehy „Moja stredná je super") ================= */

export async function saveReview(formData: FormData) {
  await assertStaff();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) return;
  const schoolId = str(formData.get("schoolId"));
  const data = {
    name,
    age: str(formData.get("age")),
    quote: str(formData.get("quote")) ?? "",
    photoUrl: str(formData.get("photoUrl")),
    schoolId: schoolId || null,
    published: formData.has("published"),
    sort: num(formData.get("sort")) ?? 0,
  };
  if (id) {
    await prisma.review.update({ where: { id }, data });
  } else {
    await prisma.review.create({ data });
  }
  revalidatePath("/admin/recenzie");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  await assertStaff();
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/recenzie");
  revalidatePath("/");
}

/* ================= ODZNAKY (Badge do kariet) ================= */

const BADGE_KINDS = new Set(["ok", "mat", "vl", "term"]);

export async function saveBadge(formData: FormData) {
  await assertStaff();
  const id = str(formData.get("id"));
  const label = str(formData.get("label"));
  const schoolId = str(formData.get("schoolId"));
  if (!label || !schoolId) return;
  const kindRaw = str(formData.get("kind")) ?? "ok";
  const kind = BADGE_KINDS.has(kindRaw) ? kindRaw : "ok";
  const data = {
    label,
    kind,
    schoolId,
    note: str(formData.get("note")),
    createdBy: (await getSessionUser())?.id ?? null,
  };
  if (id) {
    await prisma.badge.update({ where: { id }, data });
  } else {
    await prisma.badge.create({ data });
  }
  revalidatePath("/admin/badge");
  revalidatePath("/");
}

export async function deleteBadge(id: string) {
  await assertStaff();
  await prisma.badge.delete({ where: { id } });
  revalidatePath("/admin/badge");
  revalidatePath("/");
}

/* ================= FAQ (často kladené otázky) ================= */

export async function saveFaq(formData: FormData) {
  await assertStaff();
  const id = str(formData.get("id"));
  const group = str(formData.get("group"));
  const question = str(formData.get("question"));
  if (!group || !question) return;
  const data = {
    group,
    question,
    answer: str(formData.get("answer")) ?? "",
    sort: num(formData.get("sort")) ?? 0,
  };
  if (id) {
    await prisma.faq.update({ where: { id }, data });
  } else {
    await prisma.faq.create({ data });
  }
  revalidatePath("/admin/otazky");
  revalidatePath("/otazky");
}

export async function deleteFaq(id: string) {
  await assertStaff();
  await prisma.faq.delete({ where: { id } });
  revalidatePath("/admin/otazky");
  revalidatePath("/otazky");
}

/* ================= NASTAVENIA ================= */

export async function saveSettings(formData: FormData) {
  await assertStaff();
  const heroHidden = formData.has("heroHidden");
  const upsert = (key: string, value: string | number | boolean) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });

  await upsert("hero.title", str(formData.get("heroTitle")) ?? "");
  await upsert("hero.subtitle", str(formData.get("heroSubtitle")) ?? "");
  await upsert("hero.link", str(formData.get("heroLink")) ?? "");
  await upsert("hero.hidden", heroHidden);
  await upsert("cred.schools", num(formData.get("credSchools")) ?? 0);
  await upsert("cred.programs", num(formData.get("credPrograms")) ?? 0);
  await upsert("cred.places", num(formData.get("credPlaces")) ?? 0);
  await upsert("cred.dual", num(formData.get("credDual")) ?? 0);

  revalidatePath("/admin/nastavenia");
}

/* ================= POUŽÍVATELIA (ADMIN + SCHOLSTVO) ================= */

export async function createUser(formData: FormData) {
  const actor = await assertStaff();
  const email = str(formData.get("email"))?.toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = str(formData.get("name"));
  const role = parseRole(str(formData.get("role")));
  const schoolId = str(formData.get("schoolId"));

  if (!email || !password) return;
  if (!canManageRole(actor.role, role)) redirect("/admin");
  // Pri školskom účte je povinné priradiť konkrétnu školu.
  if (role === Role.SKOLA && !schoolId) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      schoolId: role === Role.SKOLA ? schoolId : null,
    },
  });
  revalidatePath("/admin/pouzivatelia");
}

export async function updateUser(userId: string, formData: FormData) {
  const actor = await assertStaff();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;

  const role = parseRole(str(formData.get("role")));
  const schoolId = str(formData.get("schoolId"));

  // Editor nesmie meniť adminov, ani nikoho povýšiť na admina.
  if (!canManageRole(actor.role, target.role)) redirect("/admin");
  if (!canManageRole(actor.role, role)) redirect("/admin");
  // Školský účet musí mať priradenú školu.
  if (role === Role.SKOLA && !schoolId && !target.schoolId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      schoolId: role === Role.SKOLA ? (schoolId ?? target.schoolId) : null,
      name: str(formData.get("name")),
    },
  });
  revalidatePath("/admin/pouzivatelia");
}

export async function resetUserPassword(userId: string, formData: FormData) {
  const actor = await assertStaff();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || !canManageRole(actor.role, target.role)) redirect("/admin");
  const password = String(formData.get("password") ?? "");
  if (!password) return;
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/admin/pouzivatelia");
}

export async function deleteUser(userId: string) {
  const actor = await assertStaff();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  // Nikto nesmie zmazať sám seba; editor nesmie zmazať admina.
  if (target.id === actor.id) return;
  if (!canManageRole(actor.role, target.role)) redirect("/admin");
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/pouzivatelia");
}
