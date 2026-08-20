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
  "room:leave": () => void;
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
 * Resolve the Socket.IO origin.
 *
 * Production (HTTPS behind Nginx): same origin — Nginx proxies `/socket.io/`
 * to the socket process. Never append :3001 on https (mixed content + closed port).
 *
 * Local / LAN: talk to the same hostname on SOCKET_PORT (default 3001).
 * Never use localhost when the page was opened via a LAN IP — that would
 * be the tablet itself, not the laptop.
 */
export function getSocketUrl(): string {
  const fromEnv = envSocketUrl();

  if (typeof window === "undefined") {
    return fromEnv || "http://localhost:3001";
  }

  if (fromEnv) {
    try {
      if (!isLoopbackHost(new URL(fromEnv).hostname)) return fromEnv;
    } catch {
      return fromEnv;
    }
  }

  if (window.location.protocol === "https:") {
    return window.location.origin;
  }

  let port = "3001";
  if (fromEnv) {
    try {
      port = new URL(fromEnv).port || "3001";
    } catch {
      port = "3001";
    }
  }
  return `http://${window.location.hostname}:${port}`;
}

export function connect(): RealtimeSocket {
  return io(getSocketUrl(), {
    autoConnect: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
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

/** Host-only: closes the room for every device. No-op if the socket is down. */
export function leaveRoom(socket: RealtimeSocket) {
  if (!socket.connected) return;
  socket.emit("room:leave");
}

export function disconnect(socket: RealtimeSocket) {
  socket.removeAllListeners();
  socket.disconnect();
}
