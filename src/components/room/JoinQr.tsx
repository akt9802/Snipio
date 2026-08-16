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
  const size = compact ? 148 : 220;

  useEffect(() => {
    if (!valid) return;

    let cancelled = false;

    async function build() {
      try {
        const origin = await resolveJoinOrigin();
        const url = tabletJoinUrl(origin, roomId);
        const qr = await QRCode.toDataURL(url, {
          width: compact ? 196 : 280,
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
        role="img"
        aria-label={`QR code to join room ${roomId}`}
        className="rounded-xl"
        style={{
          width: size,
          height: size,
          background: `#fff url(${dataUrl}) center / contain no-repeat`,
          border: "1px solid var(--bg-border)",
        }}
      />
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
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
      style={{ minHeight: compact ? 148 : 220 }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: "var(--bg-surface)",
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
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </div>
  );
}
