"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { isLoopbackHost, resolveJoinOrigin, tabletJoinUrl } from "@/lib/joinOrigin";

type Props = {
  roomId: string;
  valid: boolean;
  compact?: boolean;
};

export default function JoinQr({ roomId, valid, compact = false }: Props) {
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
          width: compact ? 220 : 280,
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
  }, [roomId, valid, compact]);

  if (!valid) {
    return <QrFrame message="A valid room code is needed before a QR can be generated." compact={compact} />;
  }

  if (failed) {
    return (
      <QrFrame
        message="Couldn’t generate a QR code. Type the room code on the tablet instead."
        compact={compact}
      />
    );
  }

  if (!dataUrl || !joinUrl) {
    return <QrFrame message="Preparing join code…" pulse compact={compact} />;
  }

  const loopback = isLoopbackHost(new URL(joinUrl).hostname);

  return (
    <div className="flex flex-col items-center text-center gap-2.5">
      <div
        className="rounded-2xl p-3 w-full max-w-[252px]"
        style={{
          background: "#fff",
          border: "1px solid var(--bg-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          role="img"
          aria-label={`QR code to join room ${roomId}`}
          className="rounded-xl w-full aspect-square"
          style={{
            background: `#fff url(${dataUrl}) center / contain no-repeat`,
          }}
        />
      </div>
      <p className={compact ? "text-sm font-semibold" : "text-base font-semibold"} style={{ color: "var(--text-primary)" }}>
        Scan with the tablet camera
      </p>
      {loopback ? (
        <p className="text-xs leading-relaxed" style={{ color: "var(--error)" }}>
          This URL is localhost, so a phone on Wi‑Fi can’t open it. Set NEXT_PUBLIC_APP_ORIGIN to your laptop’s LAN address.
        </p>
      ) : (
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {compact ? "Or type the code on Join room." : "Or type the room code on Join room. Same Wi‑Fi required."}
        </p>
      )}
    </div>
  );
}

function QrFrame({
  message,
  pulse = false,
  compact = false,
}: {
  message: string;
  pulse?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 text-center px-2"
      style={{ minHeight: compact ? 168 : 228 }}
    >
      <div
        className={`rounded-xl ${pulse ? "anim-receive-fill" : ""}`}
        style={{
          width: compact ? 72 : 96,
          height: compact ? 72 : 96,
          background: pulse ? undefined : "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
        }}
      />
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </div>
  );
}
