/** Room IDs look like `DBMS-4821`: 4 letters, a dash, 4 digits. */

export const ROOM_ID_PATTERN = /^[A-Z]{4}-\d{4}$/;

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "0123456789";

function pick(alphabet: string): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return alphabet[bytes[0] % alphabet.length];
}

export function generateRoomId(): string {
  const letters = Array.from({ length: 4 }, () => pick(LETTERS)).join("");
  const digits = Array.from({ length: 4 }, () => pick(DIGITS)).join("");
  return `${letters}-${digits}`;
}

/** Trim, uppercase, strip spaces/underscores, and insert a dash if missing. */
export function normalizeRoomId(raw: string): string {
  const compact = raw.trim().toUpperCase().replace(/[\s_]/g, "");
  if (/^[A-Z]{4}\d{4}$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return compact;
}

export function isValidRoomId(raw: string): boolean {
  return ROOM_ID_PATTERN.test(normalizeRoomId(raw));
}

export function roomPath(roomId: string, role: "host" | "tablet"): string {
  return `/room/${normalizeRoomId(roomId)}?role=${role}`;
}
