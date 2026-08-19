"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connect,
  createRoom,
  disconnect,
  joinRoom,
  leaveRoom as emitLeaveRoom,
  sendSlide as emitCapturedSlide,
  type PresencePayload,
  type RoomErrorPayload,
  type SlidePayload,
} from "@/lib/realtime";
import { isEndedRoomError } from "@/lib/roomEvents";

export type RoomSessionStatus = "connecting" | "connected" | "disconnected" | "ended";

export type RoomSession = {
  status: RoomSessionStatus;
  presence: PresencePayload | null;
  error: RoomErrorPayload | null;
  serverDown: boolean;
  sendSlide: (payload: SlidePayload) => boolean;
  subscribeSlides: (handler: (payload: SlidePayload) => void) => () => void;
  leaveRoom: () => void;
};

const UNKNOWN_RETRY_LIMIT = 3;

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
  const endedRef = useRef(false);
  const unknownAttemptsRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    endedRef.current = false;
    unknownAttemptsRef.current = 0;

    const socket = connect();
    socketRef.current = socket;

    function clearRetry() {
      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    }

    function enter() {
      if (endedRef.current) return;
      setStatus("connected");
      setServerDown(false);
      unknownAttemptsRef.current = 0;
      if (role === "host") createRoom(socket, roomId);
      else joinRoom(socket, roomId, "tablet");
    }

    function onPresence(payload: PresencePayload) {
      if (payload.roomId !== roomId) return;
      if (endedRef.current) return;
      unknownAttemptsRef.current = 0;
      clearRetry();
      setPresence(payload);
      setError(null);
      setStatus("connected");
      setServerDown(false);
    }

    function onError(payload: RoomErrorPayload) {
      if (endedRef.current && !isEndedRoomError(payload.code)) return;

      if (isEndedRoomError(payload.code)) {
        clearRetry();
        endedRef.current = true;
        setError(payload);
        setPresence(null);
        setStatus("ended");
        return;
      }

      setError(payload);
      setPresence(null);

      if (
        payload.code === "unknown_room" &&
        role === "tablet" &&
        unknownAttemptsRef.current < UNKNOWN_RETRY_LIMIT
      ) {
        unknownAttemptsRef.current += 1;
        const delay = 600 * unknownAttemptsRef.current;
        clearRetry();
        retryTimerRef.current = window.setTimeout(() => {
          if (endedRef.current) return;
          const live = socketRef.current;
          if (live?.connected) joinRoom(live, roomId, "tablet");
        }, delay);
      }
    }

    function onDisconnect() {
      if (endedRef.current) return;
      setStatus("disconnected");
      setPresence(null);
    }

    function onConnectError() {
      if (endedRef.current) return;
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
      clearRetry();
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
    if (!socket?.connected || endedRef.current) return false;
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

  const leaveRoom = useCallback(() => {
    endedRef.current = true;
    const socket = socketRef.current;
    if (socket) emitLeaveRoom(socket);
  }, []);

  return { status, presence, error, serverDown, sendSlide, subscribeSlides, leaveRoom };
}
