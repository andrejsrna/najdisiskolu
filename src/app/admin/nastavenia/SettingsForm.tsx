"use client";

import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { saveSettings } from "@/lib/admin-actions";

export function SettingsForm({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await saveSettings(formData);
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      {children}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Ukladám…" : "Uložiť nastavenia"}
        </button>
        {saved && (
          <p role="status" className="text-sm font-medium text-emerald-700">
            Nastavenia boli uložené ✓
          </p>
        )}
      </div>
    </form>
  );
}
