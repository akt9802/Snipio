import type { ExtState, BackgroundMessage } from "./types";

const roomInput = document.getElementById("room-input") as HTMLInputElement;
const socketUrlInput = document.getElementById("socket-url-input") as HTMLInputElement;
const actionBtn = document.getElementById("action-btn") as HTMLButtonElement;
const statusDot = document.getElementById("status-dot") as HTMLSpanElement;
const statusText = document.getElementById("status-text") as HTMLSpanElement;
const advancedToggle = document.getElementById("advanced-toggle") as HTMLButtonElement;
const advancedSection = document.getElementById("advanced-section") as HTMLDivElement;

// ------- Advanced section toggle -------

advancedToggle.addEventListener("click", () => {
  const open = advancedSection.classList.toggle("open");
  advancedToggle.classList.toggle("open", open);
});

// ------- Helpers -------

function normalizeRoomId(raw: string): string {
  const compact = raw.trim().toUpperCase().replace(/[\s_-]/g, "");
  if (/^[A-Z]{4}\d{4}$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return raw.trim().toUpperCase();
}

function isValidRoomId(raw: string): boolean {
  return /^[A-Z]{4}-\d{4}$/.test(normalizeRoomId(raw));
}

// ------- UI update -------

function applyState(state: ExtState) {
  const { status, roomId, error } = state;

  // Status dot
  statusDot.className = "status-dot";
  statusText.className = "status-text";

  if (status === "connecting") {
    statusDot.classList.add("connecting");
    statusText.classList.add("connecting");
    statusText.textContent = "Connecting…";
  } else if (status === "connected") {
    statusDot.classList.add("connected");
    statusText.classList.add("connected");
    statusText.textContent = `Connected · ${roomId ?? ""}`;
  } else if (status === "error") {
    statusDot.classList.add("error");
    statusText.classList.add("error");
    statusText.textContent = error ?? "Error — check room code or server";
  } else {
    statusText.textContent = "Not connected";
  }

  // Button
  if (status === "connected") {
    actionBtn.textContent = "Disconnect";
    actionBtn.className = "btn btn-secondary";
    actionBtn.dataset.action = "disconnect";
    if (roomId) roomInput.value = roomId;
  } else {
    actionBtn.textContent = status === "connecting" ? "Connecting…" : "Join Room";
    actionBtn.className = "btn btn-primary";
    actionBtn.dataset.action = "join";
    actionBtn.disabled = status === "connecting";
  }
}

async function refreshUI() {
  const state = await chrome.runtime.sendMessage<BackgroundMessage, ExtState>({ type: "GET_STATE" });
  applyState(state ?? { status: "idle", roomId: null });
}

// ------- Room input formatting -------

roomInput.addEventListener("input", () => {
  const raw = roomInput.value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
  const digits = raw.replace(/[^A-Z0-9]/g, "");
  let formatted = digits;
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  }
  roomInput.value = formatted;
});

// ------- Action button -------

actionBtn.addEventListener("click", async () => {
  const action = actionBtn.dataset.action;

  if (action === "disconnect") {
    await chrome.runtime.sendMessage<BackgroundMessage>({ type: "DISCONNECT" });
    await refreshUI();
    return;
  }

  const rawCode = roomInput.value.trim();
  const roomId = normalizeRoomId(rawCode);
  if (!isValidRoomId(roomId)) {
    applyState({ status: "error", roomId: null, error: "Enter a valid code like DBMS-4821" });
    roomInput.focus();
    return;
  }

  const socketUrl = socketUrlInput.value.trim() || "http://localhost:3001";
  await chrome.storage.local.set({ socketUrl });

  applyState({ status: "connecting", roomId });
  await chrome.runtime.sendMessage<BackgroundMessage>({ type: "JOIN", roomId, socketUrl });
}

);

// ------- Listen for state updates from background -------

chrome.runtime.onMessage.addListener((msg: BackgroundMessage) => {
  if (msg.type === "STATE_CHANGED") {
    void refreshUI();
  }
});

// ------- On popup open, restore saved socket URL and refresh state -------

chrome.storage.local.get(["socketUrl"], (result) => {
  if (result.socketUrl) {
    socketUrlInput.value = result.socketUrl as string;
  }
});

void refreshUI();
