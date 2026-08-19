export type ExtStatus = "idle" | "connecting" | "connected" | "error";

export type ExtState = {
  status: ExtStatus;
  roomId: string | null;
  error?: string;
};

export type BackgroundMessage =
  | { type: "JOIN"; roomId: string; socketUrl: string }
  | { type: "DISCONNECT" }
  | { type: "GET_STATE" }
  | { type: "STATE_CHANGED" };
