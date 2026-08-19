export type ExtStatus = "idle" | "connecting" | "connected" | "error";

export type ExtState = {
  status: ExtStatus;
  roomId: string | null;
  error?: string;
};

export type SnipToastKind = "success" | "error" | "info";

export type BackgroundMessage =
  | { type: "JOIN"; roomId: string; socketUrl: string }
  | { type: "DISCONNECT" }
  | { type: "GET_STATE" }
  | { type: "STATE_CHANGED" }
  | { type: "SNIP_PING" }
  | { type: "SNIP_HIDE" }
  | { type: "SNIP_START"; dataUrl: string }
  | { type: "SNIP_CANCEL" }
  | { type: "SNIP_CAPTURED"; mime: "image/png" | "image/jpeg"; bytes: string }
  | { type: "SNIP_TOAST"; kind: SnipToastKind; text: string };

export type SnipSendResult = { ok: true } | { ok: false; error: string };
