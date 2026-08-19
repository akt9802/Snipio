const DISMISS_KEY = "snipio.installHint.v1";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallListener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let capturing = false;
const promptListeners = new Set<InstallListener>();

function notifyPromptListeners() {
  for (const listener of promptListeners) listener();
}

/** Call once from a client entry so we don’t miss `beforeinstallprompt`. */
export function startInstallPromptCapture() {
  if (typeof window === "undefined" || capturing) return;
  capturing = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyPromptListeners();
  });
}

export function subscribeInstallPrompt(listener: InstallListener) {
  startInstallPromptCapture();
  promptListeners.add(listener);
  return () => {
    promptListeners.delete(listener);
  };
}

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const event = deferredPrompt;
  if (!event) return "unavailable";
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferredPrompt = null;
  notifyPromptListeners();
  return outcome;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function readInstallHintDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeInstallHintDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Private mode can block localStorage.
  }
}
