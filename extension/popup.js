// extension/popup.ts
var roomInput = document.getElementById("room-input");
var socketUrlInput = document.getElementById("socket-url-input");
var actionBtn = document.getElementById("action-btn");
var statusDot = document.getElementById("status-dot");
var statusText = document.getElementById("status-text");
var advancedToggle = document.getElementById("advanced-toggle");
var advancedSection = document.getElementById("advanced-section");
advancedToggle.addEventListener("click", () => {
  const open = advancedSection.classList.toggle("open");
  advancedToggle.classList.toggle("open", open);
});
function normalizeRoomId(raw) {
  const compact = raw.trim().toUpperCase().replace(/[\s_-]/g, "");
  if (/^[A-Z]{4}\d{4}$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return raw.trim().toUpperCase();
}
function isValidRoomId(raw) {
  return /^[A-Z]{4}-\d{4}$/.test(normalizeRoomId(raw));
}
function applyState(state) {
  const { status, roomId, error } = state;
  statusDot.className = "status-dot";
  statusText.className = "status-text";
  if (status === "connecting") {
    statusDot.classList.add("connecting");
    statusText.classList.add("connecting");
    statusText.textContent = "Connecting\u2026";
  } else if (status === "connected") {
    statusDot.classList.add("connected");
    statusText.classList.add("connected");
    statusText.textContent = `Connected \xB7 ${roomId ?? ""}`;
  } else if (status === "error") {
    statusDot.classList.add("error");
    statusText.classList.add("error");
    statusText.textContent = error ?? "Error \u2014 check room code or server";
  } else {
    statusText.textContent = "Not connected";
  }
  if (status === "connected") {
    actionBtn.textContent = "Disconnect";
    actionBtn.className = "btn btn-secondary";
    actionBtn.dataset.action = "disconnect";
    if (roomId) roomInput.value = roomId;
  } else {
    actionBtn.textContent = status === "connecting" ? "Connecting\u2026" : "Join Room";
    actionBtn.className = "btn btn-primary";
    actionBtn.dataset.action = "join";
    actionBtn.disabled = status === "connecting";
  }
}
async function refreshUI() {
  const state = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  applyState(state ?? { status: "idle", roomId: null });
}
roomInput.addEventListener("input", () => {
  const raw = roomInput.value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
  const digits = raw.replace(/[^A-Z0-9]/g, "");
  let formatted = digits;
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  }
  roomInput.value = formatted;
});
actionBtn.addEventListener(
  "click",
  async () => {
    const action = actionBtn.dataset.action;
    if (action === "disconnect") {
      await chrome.runtime.sendMessage({ type: "DISCONNECT" });
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
    await chrome.runtime.sendMessage({ type: "JOIN", roomId, socketUrl });
  }
);
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "STATE_CHANGED") {
    void refreshUI();
  }
});
chrome.storage.local.get(["socketUrl"], (result) => {
  if (result.socketUrl) {
    socketUrlInput.value = result.socketUrl;
  }
});
void refreshUI();
