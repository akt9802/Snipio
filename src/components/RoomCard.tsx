"use client";

import { useState } from "react";
import { BoltIcon, QrIcon } from "@/components/icons";

export default function RoomCard() {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [code, setCode] = useState("");

  return (
    <div
      className="w-full max-w-md overflow-hidden"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--bg-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="flex gap-1 p-1.5"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--bg-border)",
        }}
      >
        {(["create", "join"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer"
            style={
              tab === t
                ? {
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    boxShadow: "var(--shadow-sm)",
                  }
                : {
                    background: "transparent",
                    color: "var(--text-muted)",
                  }
            }
          >
            {t === "create" ? "Create room" : "Join room"}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "create" ? (
          <div key="create" className="anim-fade-in flex flex-col gap-4">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Start a room on this device. Share the code or QR with your tablet.
            </p>
            <button
              id="create-room-btn"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl cursor-pointer"
            >
              <BoltIcon className="w-4 h-4" />
              Create new room
            </button>
          </div>
        ) : (
          <div key="join" className="anim-fade-in flex flex-col gap-4">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Enter the room code from your laptop to receive screenshots.
            </p>
            <div className="flex gap-2">
              <input
                id="room-code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="DBMS-4821"
                maxLength={10}
                className="field-input code-font flex-1 px-4 py-3 text-sm font-medium tracking-widest rounded-xl"
              />
              <button
                id="join-room-btn"
                className="btn-primary px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
        )}

        <div
          className="mt-5 pt-4 flex items-center gap-2.5"
          style={{ borderTop: "1px solid var(--bg-border)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}
          >
            <QrIcon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          </div>
          <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {tab === "create"
              ? "QR code generated automatically for quick tablet pairing"
              : "You can also scan the QR code displayed on your laptop"}
          </span>
        </div>
      </div>
    </div>
  );
}
