import { prisma } from "@/lib/prisma";

type AuditActor = { id: string; email: string; name?: string | null } | null | undefined;

/**
 * Zapíše jednoduchý audit záznam (kto, čo, kedy). Nikdy nesmie zhodiť samotnú akciu —
 * ak zápis zlyhá (napr. migrácia ešte nebežala), len sa ticho zaloguje do konzoly.
 */
export async function logAudit(
  actor: AuditActor,
  action: "create" | "update" | "delete",
  entity: string,
  entityId?: string | null,
  label?: string | null,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: actor?.id ?? null,
        userEmail: actor?.email ?? null,
        userName: actor?.name ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        label: label ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] zápis zlyhal", err);
  }
}
