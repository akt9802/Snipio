"use client";

import { useRoomSession } from "@/lib/useRoomSession";
import type { PresencePayload } from "@/lib/realtime";

type Props = {
  roomId: string;
  role: "host" | "tablet" | "unknown";
  valid: boolean;
};

function deviceLabel(count: number) {
  return count === 1 ? "1 device" : `${count} devices`;
}

function presenceRoles(presence: PresencePayload | null) {
  return presence?.devices.map((device) => device.role).join(" · ");
}

export default function RoomPresence({ roomId, role, valid }: Props) {
  const joinRole = role === "host" ? "host" : "tablet";
  const { status, presence, error, serverDown } = useRoomSession(roomId, joinRole, valid);

  const roles = presenceRoles(presence);

  let title = "Connecting…";
  let detail = "Talking to the room server.";
  let tone: "muted" | "ok" | "error" = "muted";
  let dot = "var(--text-muted)";

  if (!valid) {
    title = "Invalid room code";
    detail = "Use a code like DBMS-4821.";
    tone = "error";
    dot = "var(--error)";
  } else if (serverDown) {
    title = "Can’t reach the room server";
    detail = "Start it with npm run dev (web + socket) and refresh.";
    tone = "error";
    dot = "var(--error)";
  } else if (error) {
    title = error.code === "unknown_room" ? "Room not found" : "Couldn’t join room";
    detail = error.message;
    tone = "error";
    dot = "var(--error)";
  } else if (status === "connected" && presence) {
    title = `${deviceLabel(presence.deviceCount)} connected`;
    detail = roles || "Waiting for another device…";
    tone = "ok";
    dot = "var(--success)";
  } else if (status === "disconnected") {
    title = "Disconnected";
    detail = "Reconnecting if the server is up…";
    tone = "muted";
  }

  return (
    <div
      className="w-full rounded-xl px-4 py-8"
      style={{
        background: tone === "error" ? "rgba(220, 53, 69, 0.06)" : "var(--bg-surface)",
        border:
          tone === "error"
            ? "1px solid rgba(220, 53, 69, 0.28)"
            : tone === "ok"
              ? "1px solid rgba(39, 160, 90, 0.28)"
              : "1px dashed var(--bg-border)",
      }}
    >
      <p className="flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
        <span
          className={status === "connecting" && !error && valid ? "dot-pulse" : ""}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: dot,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        {title}
      </p>
      <p className="text-xs mt-1" style={{ color: tone === "error" ? "var(--error)" : "var(--text-muted)" }}>
        {detail}
      </p>
    </div>
  );
}
