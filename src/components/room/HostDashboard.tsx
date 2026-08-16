"use client";

import { useEffect, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  CameraIcon,
  CheckIcon,
  CopyIcon,
  ExtensionIcon,
  MonitorIcon,
  TabletIcon,
} from "@/components/layout/icons";
import JoinQr from "@/components/room/JoinQr";
import { useRoomSession } from "@/lib/useRoomSession";
import type { DeviceRole, RoomDevice } from "@/lib/roomEvents";

type Props = {
  roomId: string;
  valid: boolean;
};

function deviceLabel(count: number) {
  return count === 1 ? "1 device" : `${count} devices`;
}

function roleMeta(role: DeviceRole) {
  if (role === "tablet") {
    return { label: "Tablet", Icon: TabletIcon };
  }
  if (role === "extension") {
    return { label: "Extension", Icon: ExtensionIcon };
  }
  return { label: "This laptop", Icon: MonitorIcon };
}

export default function HostDashboard({ roomId, valid }: Props) {
  const { status, presence, error, serverDown } = useRoomSession(roomId, "host", valid);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const tabletConnected = presence?.devices.some((device) => device.role === "tablet") ?? false;
  const deviceCount = presence?.deviceCount ?? 0;
  const devices = presence?.devices ?? [];

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function preventFileOpen(event: DragEvent) {
    event.preventDefault();
  }

  let statusTitle = "Connecting…";
  let statusDetail = "Claiming this room as host.";
  let statusTone: "wait" | "ok" | "error" = "wait";

  if (!valid) {
    statusTitle = "Invalid room code";
    statusDetail = "Use a code like DBMS-4821.";
    statusTone = "error";
  } else if (serverDown) {
    statusTitle = "Can’t reach the room server";
    statusDetail = "The room server on port 3001 isn’t reachable. Keep npm run dev running (web + socket).";
    statusTone = "error";
  } else if (error) {
    statusTitle = "Couldn’t stay in the room";
    statusDetail = error.message;
    statusTone = "error";
  } else if (status === "connected" && presence) {
    if (tabletConnected) {
      statusTitle = "Tablet connected";
      statusDetail = `${deviceLabel(deviceCount)} in this room.`;
      statusTone = "ok";
    } else {
      statusTitle = "Waiting for tablet…";
      statusDetail = `${deviceLabel(deviceCount)} connected. Join from the tablet with this code.`;
      statusTone = "wait";
    }
  } else if (status === "disconnected") {
    statusTitle = "Disconnected";
    statusDetail = "Reconnecting if the server is up…";
  }

  const statusDot =
    statusTone === "ok" ? "var(--success)" : statusTone === "error" ? "var(--error)" : "var(--accent)";

  return (
    <div className="page-wrap py-10 md:py-14 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            Host room
          </p>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Share this code with your tablet
          </h1>
        </div>
        <Link
          href="/"
          className="text-sm font-medium transition-colors self-start sm:self-auto"
          style={{ color: "var(--accent)" }}
        >
          ← Back home
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 mb-5">
        <section
          className="anim-fade-up rounded-2xl p-6 md:p-8"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <p
              className="code-font text-3xl sm:text-4xl md:text-[44px] font-bold tracking-[0.16em] leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {roomId}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-xl border cursor-pointer self-start sm:ml-auto"
              style={{
                color: copied ? "var(--success)" : "var(--text-primary)",
                borderColor: copied ? "rgba(39, 160, 90, 0.35)" : "var(--bg-border)",
                background: copied ? "var(--success-soft)" : "var(--bg-surface)",
              }}
            >
              {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>

          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-6"
            style={{
              background:
                statusTone === "ok"
                  ? "var(--success-soft)"
                  : statusTone === "error"
                    ? "rgba(220, 53, 69, 0.06)"
                    : "var(--accent-softer)",
              border:
                statusTone === "ok"
                  ? "1px solid rgba(39, 160, 90, 0.28)"
                  : statusTone === "error"
                    ? "1px solid rgba(220, 53, 69, 0.28)"
                    : "1px solid rgba(232, 100, 42, 0.18)",
            }}
          >
            <span
              className={status === "connecting" && statusTone === "wait" ? "dot-pulse" : ""}
              style={{
                width: 8,
                height: 8,
                marginTop: 6,
                borderRadius: 999,
                background: statusDot,
                flexShrink: 0,
              }}
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {statusTitle}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {statusDetail}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2.5" style={{ color: "var(--text-muted)" }}>
              Devices
            </p>
            {devices.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No devices yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {devices.map((device) => (
                  <DeviceRow key={device.id} device={device} />
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          className="anim-fade-up delay-1 rounded-2xl p-6 md:p-8 flex flex-col"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <p className="text-xs font-medium mb-4" style={{ color: "var(--text-muted)" }}>
            Tablet pairing
          </p>
          <div className="flex-1 flex items-center justify-center">
            <JoinQr roomId={roomId} valid={valid} />
          </div>
        </section>
      </div>

      <section
        className="anim-fade-up delay-2 rounded-2xl px-6 py-10 md:px-8 text-center"
        style={{
          background: "var(--bg-elevated)",
          border: "1px dashed var(--bg-border)",
          boxShadow: "var(--shadow-sm)",
        }}
        onDragOver={preventFileOpen}
        onDrop={preventFileOpen}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}
        >
          <CameraIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Drop a screenshot here
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Manual drop and paste come in a later step. For now this is just a placeholder.
        </p>
      </section>
    </div>
  );
}

function DeviceRow({ device }: { device: RoomDevice }) {
  const { label, Icon } = roleMeta(device.role);

  return (
    <li
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-border)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
      </div>
      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      <span
        className="ml-auto text-[10px] uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {device.role}
      </span>
    </li>
  );
}
