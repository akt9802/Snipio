"use client";

import { useEffect, useState } from "react";
import {
  connect,
  createRoom,
  disconnect,
  joinRoom,
  type PresencePayload,
  type RoomErrorPayload,
} from "@/lib/realtime";

type Props = {
  roomId: string;
  role: "host" | "tablet" | "unknown";
  valid: boolean;
};

type Status = "connecting" | "connected" | "disconnected";

function deviceLabel(count: number) {
  return count === 1 ? "1 device" : `${count} devices`;
}

export default function RoomPresence({ roomId, role, valid }: Props) {
  const [status, setStatus] = useState<Status>("connecting");
  const [presence, setPresence] = useState<PresencePayload | null>(null);
  const [error, setError] = useState<RoomErrorPayload | null>(null);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    if (!valid) return;

    const socket = connect();

    function enter() {
      setStatus("connected");
      setServerDown(false);
      if (role === "host") createRoom(socket, roomId);
      else joinRoom(socket, roomId, "tablet");
    }

    function onPresence(payload: PresencePayload) {
      if (payload.roomId !== roomId) return;
      setPresence(payload);
      setError(null);
    }

    function onError(payload: RoomErrorPayload) {
      setError(payload);
    }

    function onDisconnect() {
      setStatus("disconnected");
    }

    function onConnectError() {
      setServerDown(true);
      setStatus("disconnected");
    }

    socket.on("connect", enter);
    socket.on("room:presence", onPresence);
    socket.on("room:error", onError);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) enter();

    return () => {
      socket.off("connect", enter);
      socket.off("room:presence", onPresence);
      socket.off("room:error", onError);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      disconnect(socket);
    };
  }, [roomId, role, valid]);

  const roles = presence?.devices.map((device) => device.role).join(" · ");

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
