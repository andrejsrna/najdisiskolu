import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions";
import { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Administrácia — Najdi si školu",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const isSchool = user.role === Role.SKOLA;

  const pendingSections = ["Tagy", "Priestory", "Badge", "Veľtrhy", "Blog", "Nastavenia"];
  if (user.role === Role.ADMIN) pendingSections.push("Používatelia");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-bold text-slate-900">Najdi si školu</div>
          <div className="text-xs text-slate-500">TTSK · administrácia</div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/admin"
                className="block rounded-lg bg-slate-900 px-3 py-2 font-medium text-white"
              >
                Prehľad
              </Link>
            </li>
            {!isSchool && (
              <li>
                <Link
                  href="/admin/skoly"
                  className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
                >
                  Školy
                </Link>
              </li>
            )}
            {isSchool && (
              <li>
                <Link
                  href="/admin/skoly"
                  className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
                >
                  Moja škola
                </Link>
              </li>
            )}
            {pendingSections.map((item) => (
              <li key={item}>
                <span className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-400">
                  {item}
                  <span className="text-[10px] uppercase tracking-wide text-slate-300">
                    čoskoro
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-600">
            Prihlásený ako{" "}
            <span className="font-medium text-slate-900">{user.name ?? user.email}</span>
            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-900">
              Odhlásiť sa
            </button>
          </form>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
