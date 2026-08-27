"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-token";

export type ActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Nesprávny email alebo heslo." };
  }

  const store = await cookies();
  // Secure flag nasleduje SKUTOČNÝ protokol požiadavky (X-Forwarded-Proto od Traefik/Coolify).
  // Keď je aplikácia dostupná po HTTP, Secure cookie by prehliadač neposlal a relácia by sa
  // stratila pri každej navigácii (nutnosť prihlásiť sa znova).
  const isHttps = (await headers()).get("x-forwarded-proto") === "https";
  store.set(SESSION_COOKIE_NAME, await createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
