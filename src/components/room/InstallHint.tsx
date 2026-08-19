"use client";

import { useCallback, useEffect, useState } from "react";
import { CloseIcon, DownloadIcon } from "@/components/layout/icons";
import {
  isIosDevice,
  isStandaloneDisplay,
  readInstallHintDismissed,
  writeInstallHintDismissed,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";

export default function InstallHint() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() || readInstallHintDismissed()) return;

    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      writeInstallHintDismissed();
      setVisible(false);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => setVisible(true), 500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    writeInstallHintDismissed();
    setVisible(false);
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") {
      writeInstallHintDismissed();
      setVisible(false);
    }
  }

  if (!visible || isStandaloneDisplay()) return null;
  const ios = isIosDevice();
  if (!promptEvent && !ios) return null;

  return (
    <div
      className="rounded-2xl px-4 py-3 mb-4 flex items-start gap-3"
      style={{
        background: "var(--accent-softer)",
        border: "1px solid rgba(232, 100, 42, 0.28)",
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Add Snipio to Home Screen
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {promptEvent
            ? "Install so the feed sits in split-screen next to Notes — no browser chrome."
            : "Open Share, then Add to Home Screen. The feed works like an app in split view."}
        </p>
        {promptEvent ? (
          <button
            type="button"
            onClick={() => void install()}
            className="btn-primary inline-flex items-center justify-center gap-2 min-h-11 px-4 mt-3 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4" />
            Install
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="inline-flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 cursor-pointer"
        style={{ color: "var(--text-muted)" }}
        aria-label="Dismiss install hint"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
