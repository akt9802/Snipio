/// <reference types="chrome"/>

import { io, type Socket } from "socket.io-client";
import type { ExtState, BackgroundMessage } from "./types";

// ---- State ----

let socket: Socket | null = null;
let state: ExtState = { status: "idle", roomId: null };

function setState(next: ExtState) {
  state = next;
  chrome.storage.local.set({ extState: next });
  // Notify the popup if it's open (fire-and-forget; it may not be open)
  chrome.runtime.sendMessage<BackgroundMessage>({ type: "STATE_CHANGED" }).catch(() => {});
}

// ---- Socket helpers ----

function teardown() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

function connect(roomId: string, socketUrl: string) {
  teardown();

  setState({ status: "connecting", roomId });

  socket = io(socketUrl, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    // Join as extension role
    socket!.emit("room:join", { roomId, role: "extension" });
  });

  socket.on("room:presence", () => {
    // Presence update means we are in the room
    setState({ status: "connected", roomId });
  });

  socket.on("room:error", (payload: { message: string }) => {
    setState({ status: "error", roomId, error: payload.message });
    teardown();
  });

  socket.on("disconnect", () => {
    if (state.status === "connected") {
      setState({ status: "idle", roomId: null });
    }
  });

  socket.on("connect_error", (err: Error) => {
    setState({
      status: "error",
      roomId,
      error: `Can't reach socket server — is npm run dev running? (${err.message})`,
    });
  });
}

function disconnect() {
  teardown();
  setState({ status: "idle", roomId: null });
}

// ---- Message handler (popup ↔ background) ----

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, _sender, sendResponse: (r: unknown) => void) => {
    if (message.type === "GET_STATE") {
      sendResponse(state);
      return false;
    }

    if (message.type === "JOIN") {
      const { roomId, socketUrl } = message as Extract<BackgroundMessage, { type: "JOIN" }>;
      connect(roomId, socketUrl);
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DISCONNECT") {
      disconnect();
      sendResponse({ ok: true });
      return false;
    }

    return false;
  },
);

// ---- Keyboard command (Alt+S) ----

chrome.commands.onCommand.addListener((command) => {
  if (command !== "capture") return;

  if (state.status !== "connected" || !socket?.connected) {
    console.log("[Snipio] Alt+S — not connected to a room. Open the popup and join first.");
    return;
  }

  // Step 9 will implement actual video-frame capture.
  // For now, log so the keyboard shortcut can be verified as registered.
  console.log(`[Snipio] Alt+S — capture queued for room ${state.roomId}`);
});

// ---- On extension install / startup, restore previous state if connected ----

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["extState", "socketUrl"], (result) => {
    const saved = result.extState as ExtState | undefined;
    const socketUrl = (result.socketUrl as string | undefined) ?? "http://localhost:3001";
    if (saved?.status === "connected" && saved.roomId) {
      connect(saved.roomId, socketUrl);
    }
  });
});
