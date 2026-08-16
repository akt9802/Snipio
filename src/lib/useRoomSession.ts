"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connect,
  createRoom,
  disconnect,
  joinRoom,
  sendSlide as emitCapturedSlide,
  type PresencePayload,
  type RoomErrorPayload,
  type SlidePayload,
} from "@/lib/realtime";

export type RoomSessionStatus = "connecting" | "connected" | "disconnected";

export type RoomSession = {
  status: RoomSessionStatus;
  presence: PresencePayload | null;
  error: RoomErrorPayload | null;
  serverDown: boolean;
  sendSlide: (payload: SlidePayload) => boolean;
  subscribeSlides: (handler: (payload: SlidePayload) => void) => () => void;
};

export function useRoomSession(
  roomId: string,
  role: "host" | "tablet",
  enabled = true,
): RoomSession {
  const [status, setStatus] = useState<RoomSessionStatus>("connecting");
  const [presence, setPresence] = useState<PresencePayload | null>(null);
  const [error, setError] = useState<RoomErrorPayload | null>(null);
  const [serverDown, setServerDown] = useState(false);
  const socketRef = useRef<ReturnType<typeof connect> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = connect();
    socketRef.current = socket;

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
      socketRef.current = null;
      socket.off("connect", enter);
      socket.off("room:presence", onPresence);
      socket.off("room:error", onError);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      disconnect(socket);
    };
  }, [roomId, role, enabled]);

  const sendSlide = useCallback((payload: SlidePayload) => {
    const socket = socketRef.current;
    if (!socket?.connected) return false;
    emitCapturedSlide(socket, payload);
    return true;
  }, []);

  const subscribeSlides = useCallback((handler: (payload: SlidePayload) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("slide:received", handler);
    return () => {
      socket.off("slide:received", handler);
    };
  }, []);

  return { status, presence, error, serverDown, sendSlide, subscribeSlides };
}
