"use client";

import { useEffect } from "react";
import { startInstallPromptCapture } from "@/lib/pwa";

if (typeof window !== "undefined") {
  startInstallPromptCapture();
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    startInstallPromptCapture();
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Registration can fail on http://LAN-IP in some browsers; install still works on localhost / HTTPS.
    });
  }, []);

  return null;
}
