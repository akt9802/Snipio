"use client";

import { io, type Socket } from "socket.io-client";
import { isLoopbackHost } from "@/lib/joinOrigin";
import type {
  PresencePayload,
  RoomCreatePayload,
  RoomErrorPayload,
  RoomJoinPayload,
  SlidePayload,
} from "@/lib/roomEvents";

export type {
  DeviceRole,
  PresencePayload,
  RoomDevice,
  RoomErrorCode,
  RoomErrorPayload,
  SlidePayload,
} from "@/lib/roomEvents";

export type ClientToServerEvents = {
  "room:create": (payload: RoomCreatePayload) => void;
  "room:join": (payload: RoomJoinPayload) => void;
  "slide:captured": (payload: SlidePayload) => void;
};

export type ServerToClientEvents = {
  "room:presence": (payload: PresencePayload) => void;
  "room:error": (payload: RoomErrorPayload) => void;
  "slide:received": (payload: SlidePayload) => void;
};

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function envSocketUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "";
}

/**
 * Talk to the room server on the same hostname as the page, port 3001.
 * Never use localhost when the page was opened via a LAN IP — that would
 * be the tablet itself, not the laptop.
 */
export function getSocketUrl(): string {
  const fromEnv = envSocketUrl();

  if (typeof window !== "undefined") {
    if (fromEnv) {
      try {
        if (!isLoopbackHost(new URL(fromEnv).hostname)) return fromEnv;
      } catch {
        return fromEnv;
      }
    }

    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    let port = "3001";
    if (fromEnv) {
      try {
        port = new URL(fromEnv).port || "3001";
      } catch {
        port = "3001";
      }
    }
    return `${protocol}//${window.location.hostname}:${port}`;
  }

  return fromEnv || "http://localhost:3001";
}

export function connect(): RealtimeSocket {
  return io(getSocketUrl(), {
    autoConnect: true,
    transports: ["websocket", "polling"],
  });
}

export function createRoom(socket: RealtimeSocket, roomId: string) {
  const send = () => socket.emit("room:create", { roomId });
  if (socket.connected) send();
  else socket.once("connect", send);
}

export function joinRoom(
  socket: RealtimeSocket,
  roomId: string,
  role: RoomJoinPayload["role"] = "tablet",
) {
  const send = () => socket.emit("room:join", { roomId, role });
  if (socket.connected) send();
  else socket.once("connect", send);
}

export function sendSlide(socket: RealtimeSocket, payload: SlidePayload) {
  socket.emit("slide:captured", payload);
}

export function disconnect(socket: RealtimeSocket) {
  socket.removeAllListeners();
  socket.disconnect();
}
