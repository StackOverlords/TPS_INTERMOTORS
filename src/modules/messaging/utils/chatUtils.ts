import type { ParticipantRole } from "../types/Chat.types";
import type { Participant } from "../types/Participant.types";

/** Retorna las iniciales de un nombre "Nombre Apellido" → "NA" */
export function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const ROLE_ORDER: Record<ParticipantRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MEMBER: 2,
};

export function sortParticipantsByRole(
  participants: Participant[],
): Participant[] {
  return [...participants].sort((a, b) => {
    // 1. Orden por rol
    const roleDiff = ROLE_ORDER[a.rol] - ROLE_ORDER[b.rol];

    if (roleDiff !== 0) {
      return roleDiff;
    }

    // 2. Orden alfabético dentro del mismo rol
    const nameA = a.usuario?.nombre?.toLowerCase() ?? "";
    const nameB = b.usuario?.nombre?.toLowerCase() ?? "";

    return nameA.localeCompare(nameB, "es", {
      sensitivity: "base",
    });
  });
}
