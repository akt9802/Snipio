"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { isLoopbackHost, resolveJoinOrigin, tabletJoinUrl } from "@/lib/joinOrigin";

type Props = {
  roomId: string;
  valid: boolean;
};

export default function JoinQr({ roomId, valid }: Props) {
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!valid) return;

    let cancelled = false;

    async function build() {
      try {
        const origin = await resolveJoinOrigin();
        const url = tabletJoinUrl(origin, roomId);
        const qr = await QRCode.toDataURL(url, {
          width: 280,
          margin: 1,
          color: { dark: "#1a1714", light: "#ffffff" },
        });
        if (cancelled) return;
        setJoinUrl(url);
        setDataUrl(qr);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void build();
    return () => {
      cancelled = true;
    };
  }, [roomId, valid]);

  if (!valid) {
    return <QrFrame message="A valid room code is needed before a QR can be generated." />;
  }

  if (failed) {
    return <QrFrame message="Couldn’t generate a QR code. Type the room code on the tablet instead." />;
  }

  if (!dataUrl || !joinUrl) {
    return <QrFrame message="Preparing join code…" pulse />;
  }

  const loopback = isLoopbackHost(new URL(joinUrl).hostname);

  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        role="img"
        aria-label={`QR code to join room ${roomId}`}
        className="rounded-xl w-[220px] h-[220px]"
        style={{
          background: `#fff url(${dataUrl}) center / contain no-repeat`,
          border: "1px solid var(--bg-border)",
        }}
      />
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Scan with your tablet camera
      </p>
      <p
        className="text-[11px] leading-relaxed break-all max-w-[16rem] code-font"
        style={{ color: "var(--text-muted)" }}
      >
        {joinUrl}
      </p>
      {loopback ? (
        <p className="text-xs leading-relaxed max-w-[16rem]" style={{ color: "var(--error)" }}>
          This URL is localhost, so a phone on Wi‑Fi can’t open it. Set NEXT_PUBLIC_APP_ORIGIN to your laptop’s LAN address (http://192.168.x.x:3000).
        </p>
      ) : (
        <p className="text-xs leading-relaxed max-w-[16rem]" style={{ color: "var(--text-muted)" }}>
          Or type the room code on Join room. Same Wi‑Fi required.
        </p>
      )}
    </div>
  );
}

function QrFrame({ message, pulse = false }: { message: string; pulse?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-4 min-h-[220px]">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
        }}
      >
        <span
          className={pulse ? "dot-pulse" : ""}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--text-muted)",
            display: "inline-block",
          }}
        />
      </div>
      <p className="text-xs max-w-[16rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </div>
  );
}
