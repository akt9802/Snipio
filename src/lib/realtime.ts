"use client";

import { io, type Socket } from "socket.io-client";
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

export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:3001`;
  }
  return "http://localhost:3001";
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

export function disconnect(socket: RealtimeSocket) {
  socket.removeAllListeners();
  socket.disconnect();
}
