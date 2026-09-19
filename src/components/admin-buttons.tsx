"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit tlačidlo so stavovou hláškou: počas odosielania „Ukladám…",
 * po dokončení akcie krátko „Uložené ✓", potom sa vráti na pôvodný názov.
 */
export function SaveButton({
  children = "Uložiť",
  savedLabel = "Uložené ✓",
  className = "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700",
}: {
  children?: React.ReactNode;
  savedLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const [submitted, setSubmitted] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const showSavedBriefly = () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    setSubmitted(true);
    resetTimer.current = window.setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={showSavedBriefly}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Ukladám…" : submitted && !pending ? savedLabel : children}
    </button>
  );
}

/** Submit tlačidlo nezvratnej akcie s potvrdením. */
export function DeleteButton({
  children = "Zmazať",
  message = "Naozaj zmazať? Túto akciu nie je možné vrátiť späť.",
  className = "rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50",
  formAction,
}: {
  children?: React.ReactNode;
  message?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
