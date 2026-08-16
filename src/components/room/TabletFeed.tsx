"use client";

import Link from "next/link";
import AutoSaveToggle from "@/components/room/AutoSaveToggle";
import SlideCard, { type SlideCardProps } from "@/components/room/SlideCard";
import { BoltIcon } from "@/components/layout/icons";
import { useRoomSession } from "@/lib/useRoomSession";

type Props = {
  roomId: string;
  valid: boolean;
};

export default function TabletFeed({ roomId, valid }: Props) {
  const { status, presence, error, serverDown } = useRoomSession(roomId, "tablet", valid);
  const slides: SlideCardProps[] = [];

  const roomMissing =
    error?.code === "unknown_room" || error?.code === "expired" || error?.code === "invalid_id";
  const inRoom = valid && status === "connected" && Boolean(presence) && !error && !serverDown;

  let statusLabel = "Connecting";
  let statusColor = "var(--accent)";
  let pulse = true;

  if (!valid || roomMissing) {
    statusLabel = "Room not found";
    statusColor = "var(--error)";
    pulse = false;
  } else if (serverDown) {
    statusLabel = "Offline";
    statusColor = "var(--error)";
    pulse = false;
  } else if (error) {
    statusLabel = "Error";
    statusColor = "var(--error)";
    pulse = false;
  } else if (inRoom) {
    statusLabel = "Connected";
    statusColor = "var(--success)";
    pulse = false;
  } else if (status === "disconnected") {
    statusLabel = "Disconnected";
    statusColor = "var(--text-muted)";
    pulse = false;
  }

  return (
    <div
      className="flex flex-col min-h-screen grain relative"
      style={{ background: "var(--bg-base)" }}
    >
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(250,249,247,0.94)",
          borderBottom: "1px solid var(--bg-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="w-full max-w-xl mx-auto px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-3 min-h-11">
            <Link href="/" className="flex items-center gap-2 min-h-11 pr-1" aria-label="Back home">
              <span
                className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent)", boxShadow: "0 4px 10px rgba(232,100,42,0.28)" }}
              >
                <BoltIcon className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Snipio
              </span>
            </Link>

            <span
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-2.5 min-h-8 rounded-full"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                className={pulse ? "dot-pulse" : ""}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: statusColor,
                  display: "inline-block",
                }}
              />
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <p
              className="code-font text-lg font-bold tracking-[0.14em] truncate min-h-11 flex items-center"
              style={{ color: "var(--text-primary)" }}
            >
              {roomId}
            </p>
            <div className="ml-auto flex-shrink-0">
              <AutoSaveToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5">
        {!valid || roomMissing ? (
          <ErrorPanel
            title="Room not found — create one on the laptop."
            detail={
              error?.message ??
              "This room isn’t active. Open Snipio on your laptop and create a room first."
            }
          />
        ) : serverDown ? (
          <ErrorPanel
            title="Can’t reach the room server"
            detail="Keep npm run dev running so the tablet can join."
          />
        ) : error ? (
          <ErrorPanel title="Couldn’t join room" detail={error.message} />
        ) : slides.length === 0 ? (
          <EmptyFeed connecting={!inRoom} />
        ) : (
          <ul className="flex flex-col gap-3">
            {slides.map((slide) => (
              <li key={slide.id}>
                <SlideCard {...slide} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyFeed({ connecting }: { connecting: boolean }) {
  return (
    <div
      className="rounded-2xl px-5 py-14 text-center"
      style={{
        background: "var(--bg-elevated)",
        border: "1px dashed var(--bg-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <p className="text-base font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
        Waiting for slides.
      </p>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Press <kbd>Alt</kbd>+<kbd>S</kbd> on the laptop.
      </p>
      <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
        {connecting ? "Connecting to the room…" : "New slides will show up here, newest first."}
      </p>
    </div>
  );
}

function ErrorPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-10 text-center"
      style={{
        background: "rgba(220, 53, 69, 0.06)",
        border: "1px solid rgba(220, 53, 69, 0.28)",
      }}
    >
      <p className="text-base font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {detail}
      </p>
      <Link
        href="/"
        className="btn-primary inline-flex items-center justify-center min-h-11 px-5 mt-6 rounded-xl text-sm font-semibold"
      >
        Back home
      </Link>
    </div>
  );
}
