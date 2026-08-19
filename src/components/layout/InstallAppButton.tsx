"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { DownloadIcon } from "@/components/layout/icons";
import {
  getDeferredInstallPrompt,
  isIosDevice,
  isStandaloneDisplay,
  promptInstall,
  startInstallPromptCapture,
  subscribeInstallPrompt,
} from "@/lib/pwa";

type Variant = "nav" | "hero";

function subscribeStandalone(onChange: () => void) {
  const standalone = window.matchMedia("(display-mode: standalone)");
  const overlay = window.matchMedia("(display-mode: window-controls-overlay)");
  standalone.addEventListener("change", onChange);
  overlay.addEventListener("change", onChange);
  return () => {
    standalone.removeEventListener("change", onChange);
    overlay.removeEventListener("change", onChange);
  };
}

export default function InstallAppButton({ variant = "nav" }: { variant?: Variant }) {
  const prompt = useSyncExternalStore(
    subscribeInstallPrompt,
    getDeferredInstallPrompt,
    () => null,
  );
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    isStandaloneDisplay,
    () => false,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startInstallPromptCapture();
  }, []);

  useEffect(() => {
    if (!helpOpen) return;

    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setHelpOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setHelpOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [helpOpen]);

  if (standalone) return null;

  async function onClick() {
    const result = await promptInstall();
    if (result === "unavailable") setHelpOpen((open) => !open);
  }

  const ios = typeof navigator !== "undefined" && isIosDevice();

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => void onClick()}
        aria-expanded={helpOpen}
        aria-controls={helpOpen ? panelId : undefined}
        className={
          variant === "hero"
            ? "btn-primary inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap"
            : "inline-flex items-center gap-2 min-h-10 px-3.5 text-sm font-semibold rounded-xl border cursor-pointer whitespace-nowrap"
        }
        style={
          variant === "hero"
            ? undefined
            : {
                color: "var(--accent)",
                background: "var(--accent-soft)",
                borderColor: "rgba(232,100,42,0.28)",
              }
        }
      >
        <DownloadIcon className="w-4 h-4" />
        Download as app
      </button>

      {helpOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="How to install Snipio"
          className={
            variant === "hero"
              ? "absolute left-0 top-[calc(100%+8px)] z-[80] w-[min(100vw-2rem,20rem)] rounded-2xl p-4 text-left"
              : "absolute right-0 top-[calc(100%+8px)] z-[80] w-[min(100vw-2rem,20rem)] rounded-2xl p-4 text-left"
          }
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Install Snipio on this device
          </p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {ios
              ? "Tap Share, then Add to Home Screen. The tablet feed opens like an app in split view."
              : prompt
                ? "Use the install dialog, or the install icon in the address bar."
                : "Chrome / Edge: menu ⋮ → Cast, save and share → Install page as app — or the install icon in the address bar. Samsung Internet: menu → Add page to → Home screen."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
