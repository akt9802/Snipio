export type DeviceRole = "host" | "tablet" | "extension";

export type RoomDevice = {
  id: string;
  role: DeviceRole;
};

export type PresencePayload = {
  roomId: string;
  deviceCount: number;
  devices: RoomDevice[];
};

export type RoomErrorCode = "unknown_room" | "expired" | "closed" | "full" | "invalid_id";

export type RoomErrorPayload = {
  code: RoomErrorCode;
  message: string;
};

/** Soft cap so a leaked QR does not fill a lecture with random joiners. */
export const MAX_TABLETS_PER_ROOM = 2;
export const MAX_EXTENSIONS_PER_ROOM = 1;

export const ROOM_ENDED_MESSAGE = "This room ended. Create a new one.";
export const ROOM_CLOSED_MESSAGE = "The host left. This room is closed.";

export function isEndedRoomError(code: RoomErrorCode | undefined): boolean {
  return code === "expired" || code === "closed";
}

export type SlidePayload = {
  id: string;
  mime: string;
  bytes: string;
  createdAt: number;
};

export const ALLOWED_SLIDE_MIMES = ["image/png", "image/jpeg"] as const;

export type AllowedSlideMime = (typeof ALLOWED_SLIDE_MIMES)[number];

/** Original file size cap. Base64 on the wire is ~4/3 of this; socket max is 8MB. */
export const MAX_SLIDE_BYTES = 5 * 1024 * 1024;
const MAX_SLIDE_B64_CHARS = Math.ceil((MAX_SLIDE_BYTES * 4) / 3) + 64;

export function isAllowedSlideMime(mime: string): mime is AllowedSlideMime {
  return mime === "image/png" || mime === "image/jpeg";
}

export function isValidSlidePayload(
  payload: SlidePayload | null | undefined,
): payload is SlidePayload {
  if (!payload || typeof payload !== "object") return false;
  if (typeof payload.id !== "string" || payload.id.length < 8 || payload.id.length > 80) {
    return false;
  }
  if (!isAllowedSlideMime(payload.mime)) return false;
  if (
    typeof payload.bytes !== "string" ||
    payload.bytes.length === 0 ||
    payload.bytes.length > MAX_SLIDE_B64_CHARS
  ) {
    return false;
  }
  if (typeof payload.createdAt !== "number" || !Number.isFinite(payload.createdAt)) {
    return false;
  }
  return true;
}

export type RoomCreatePayload = {
  roomId: string;
};

export type RoomJoinPayload = {
  roomId: string;
  role?: Exclude<DeviceRole, "host">;
};
