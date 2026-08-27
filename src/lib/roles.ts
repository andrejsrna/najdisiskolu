import { Role } from "@/generated/prisma/enums";

/** Parsuje reťazec z formulára na validnú rolu (default SKOLA). */
export function parseRole(raw: string | null): Role {
  return raw === "ADMIN" || raw === "SCHOLSTVO" || raw === "SKOLA"
    ? (raw as Role)
    : Role.SKOLA;
}

/**
 * Či môže `actor` spravovať účet s rolou `target`.
 * ADMIN → všetko. SCHOLSTVO (editor) → editor + škola (nikdy admin).
 */
export function canManageRole(actor: Role, target: Role): boolean {
  if (actor === Role.ADMIN) return true;
  if (actor === Role.SCHOLSTVO) return target === Role.SCHOLSTVO || target === Role.SKOLA;
  return false;
}

/** Roly, ktoré môže `actor` vytvárať (admin všetko, editor editor+škola). */
export function creatableRolesFor(actor: Role): Role[] {
  if (actor === Role.ADMIN) return [Role.ADMIN, Role.SCHOLSTVO, Role.SKOLA];
  if (actor === Role.SCHOLSTVO) return [Role.SCHOLSTVO, Role.SKOLA];
  return [];
}
