/// <reference types="chrome"/>

import { io, type Socket } from "socket.io-client";
import type { BackgroundMessage, ExtState, SnipSendResult, SnipToastKind } from "./types";

const DEFAULT_SOCKET_URL = "http://localhost:3001";
const MAX_SLIDE_BYTES = 5 * 1024 * 1024;
const MAX_SLIDE_B64_CHARS = Math.ceil((MAX_SLIDE_BYTES * 4) / 3) + 64;
const UNKNOWN_RETRY_LIMIT = 3;

let socket: Socket | null = null;
let state: ExtState = { status: "idle", roomId: null };
let snipGeneration = 0;
let intended: { roomId: string; socketUrl: string } | null = null;
let manualDisconnect = false;
let unknownAttempts = 0;
let unknownTimer: ReturnType<typeof setTimeout> | null = null;
let hadPresence = false;
let onReconnectAttempt: (() => void) | null = null;

function setState(next: ExtState) {
  state = next;
  chrome.storage.local.set({ extState: next });
  chrome.runtime.sendMessage<BackgroundMessage>({ type: "STATE_CHANGED" }).catch(() => {});
}

function clearUnknownTimer() {
  if (unknownTimer) {
    clearTimeout(unknownTimer);
    unknownTimer = null;
  }
}

function persistJoin(roomId: string, socketUrl: string) {
  intended = { roomId, socketUrl };
  chrome.storage.local.set({ joinedRoom: intended });
}

function clearJoin() {
  intended = null;
  chrome.storage.local.remove("joinedRoom");
}

function teardown() {
  clearUnknownTimer();
  if (!socket) return;
  if (onReconnectAttempt) {
    socket.io.off("reconnect_attempt", onReconnectAttempt);
    onReconnectAttempt = null;
  }
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

function joinAsExtension(roomId: string) {
  socket?.emit("room:join", { roomId, role: "extension" });
}

function connect(roomId: string, socketUrl: string) {
  teardown();
  manualDisconnect = false;
  unknownAttempts = 0;
  hadPresence = false;
  persistJoin(roomId, socketUrl);
  setState({ status: "connecting", roomId });

  socket = io(socketUrl, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    if (manualDisconnect || !intended) return;
    unknownAttempts = 0;
    if (state.status !== "connected") {
      setState({ status: hadPresence ? "reconnecting" : "connecting", roomId });
    }
    joinAsExtension(roomId);
  });

  onReconnectAttempt = () => {
    if (manualDisconnect || !intended) return;
    setState({ status: "reconnecting", roomId });
  };
  socket.io.on("reconnect_attempt", onReconnectAttempt);

  socket.on("room:presence", () => {
    if (manualDisconnect || !intended) return;
    unknownAttempts = 0;
    hadPresence = true;
    clearUnknownTimer();
    setState({ status: "connected", roomId });
  });

  socket.on("room:error", (payload: { code?: string; message: string }) => {
    if (manualDisconnect) return;
    const code = payload.code;

    if (code === "unknown_room") {
      if (hadPresence) {
        setState({ status: "reconnecting", roomId });
        clearUnknownTimer();
        unknownTimer = setTimeout(() => {
          if (manualDisconnect || !socket?.connected || !intended) return;
          joinAsExtension(roomId);
        }, 1000);
        return;
      }

      unknownAttempts += 1;
      setState({ status: "error", roomId, error: payload.message });
      if (unknownAttempts <= UNKNOWN_RETRY_LIMIT) {
        clearUnknownTimer();
        unknownTimer = setTimeout(() => {
          if (manualDisconnect || !socket?.connected || !intended) return;
          joinAsExtension(roomId);
        }, 600 * unknownAttempts);
        return;
      }
      clearJoin();
      teardown();
      return;
    }

    setState({ status: "error", roomId, error: payload.message });
    if (code === "expired" || code === "closed" || code === "full" || code === "invalid_id") {
      clearJoin();
      teardown();
    }
  });

  socket.on("disconnect", (reason) => {
    if (manualDisconnect) return;
    if (reason === "io client disconnect") return;
    setState({ status: "reconnecting", roomId });
  });

  socket.on("connect_error", () => {
    if (manualDisconnect || !intended) return;
    setState({
      status: "reconnecting",
      roomId,
      error: "Can’t reach the room server — reconnecting…",
    });
  });
}

function disconnect() {
  manualDisconnect = true;
  clearJoin();
  teardown();
  setState({ status: "idle", roomId: null });
}

function restoreConnection(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["extState", "socketUrl", "joinedRoom"], (result) => {
      const savedJoin = result.joinedRoom as { roomId?: string; socketUrl?: string } | undefined;
      const saved = result.extState as ExtState | undefined;
      const socketUrl =
        savedJoin?.socketUrl ??
        (result.socketUrl as string | undefined) ??
        DEFAULT_SOCKET_URL;
      const roomId = savedJoin?.roomId ?? saved?.roomId ?? null;
      const shouldRestore =
        Boolean(roomId) &&
        !socket &&
        saved?.status !== "idle" &&
        saved?.status !== "error";

      if (roomId && (savedJoin || shouldRestore)) {
        connect(roomId, socketUrl);
      }
      resolve();
    });
  });
}

const booted = restoreConnection();
chrome.runtime.onStartup.addListener(() => {
  void restoreConnection();
});

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, _sender, sendResponse: (r: unknown) => void) => {
    if (message.type === "GET_STATE") {
      sendResponse(state);
      return false;
    }

    if (message.type === "JOIN") {
      connect(message.roomId, message.socketUrl);
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DISCONNECT") {
      disconnect();
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "SNIP_CAPTURED") {
      sendResponse(emitCrop(message));
      return false;
    }

    return false;
  },
);

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "capture") return;
  void handleCapture(tab);
});

function emitCrop(
  message: Extract<BackgroundMessage, { type: "SNIP_CAPTURED" }>,
): SnipSendResult {
  if (state.status !== "connected" || !socket?.connected) {
    return { ok: false, error: "Join a room first" };
  }
  if (message.mime !== "image/png" && message.mime !== "image/jpeg") {
    return { ok: false, error: "Couldn't send that image" };
  }
  if (!message.bytes || message.bytes.length > MAX_SLIDE_B64_CHARS) {
    return { ok: false, error: "Selection is too large — try a smaller region" };
  }

  socket.emit("slide:captured", {
    id: crypto.randomUUID(),
    mime: message.mime,
    bytes: message.bytes,
    createdAt: Date.now(),
  });
  return { ok: true };
}

async function handleCapture(tabFromCommand?: chrome.tabs.Tab) {
  await booted;
  if (state.status === "connecting" || state.status === "reconnecting") {
    await waitForSocket(2500);
  }

  const tab = await resolveTab(tabFromCommand);

  if (state.status === "reconnecting") {
    await toastOnTab(tab, "Reconnecting to the room — try Alt+S again", "info");
    return;
  }

  if (state.status !== "connected" || !socket?.connected) {
    await toastOnTab(tab, "Join a room first", "info");
    return;
  }

  if (!tab?.id || tab.windowId == null) return;

  if (isRestrictedUrl(tab.url)) {
    await toastOnTab(tab, "Can't snip this page — open a lecture tab", "error");
    return;
  }

  const injected = await ensureContentScript(tab.id);
  if (!injected) {
    console.warn("[Snipio] Refresh this page, then press Alt+S again.");
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "SNIP_HIDE" } satisfies BackgroundMessage);
  } catch {
    // No overlay yet.
  }
  await pause(48);

  const generation = ++snipGeneration;
  let dataUrl: string;
  try {
    dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  } catch (err) {
    console.warn("[Snipio] captureVisibleTab failed:", err);
    await toastOnTab(tab, "Couldn't capture this tab", "error");
    return;
  }

  if (generation !== snipGeneration) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SNIP_START",
      dataUrl,
    } satisfies BackgroundMessage);
  } catch {
    await toastOnTab(tab, "Refresh this page, then press Alt+S again", "error");
  }
}

async function ensureContentScript(tabId: number): Promise<boolean> {
  if (await pingTab(tabId)) return true;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch {
    return false;
  }
  return pingTab(tabId);
}

async function pingTab(tabId: number): Promise<boolean> {
  try {
    const response = (await chrome.tabs.sendMessage(tabId, {
      type: "SNIP_PING",
    } satisfies BackgroundMessage)) as { ok?: boolean } | undefined;
    return Boolean(response?.ok);
  } catch {
    return false;
  }
}

async function toastOnTab(
  tab: chrome.tabs.Tab | undefined,
  text: string,
  kind: SnipToastKind,
) {
  if (!tab?.id) return;
  if (!(await ensureContentScript(tab.id))) return;
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SNIP_TOAST",
      kind,
      text,
    } satisfies BackgroundMessage);
  } catch {
    // Restricted pages cannot show an in-page toast.
  }
}

async function resolveTab(tab?: chrome.tabs.Tab) {
  if (tab?.id) return tab;
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return active;
}

function isRestrictedUrl(url: string | undefined) {
  if (!url) return false;
  return /^(chrome|chrome-extension|edge|about|devtools|chrome-untrusted):/i.test(url);
}

function pause(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function waitForSocket(ms: number): Promise<boolean> {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (state.status === "connected" && socket?.connected) {
        resolve(true);
        return;
      }
      if (state.status === "error" || state.status === "idle" || Date.now() - started >= ms) {
        resolve(false);
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}
