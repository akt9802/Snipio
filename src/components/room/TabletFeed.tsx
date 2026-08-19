"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AutoSaveToggle from "@/components/room/AutoSaveToggle";
import InstallHint from "@/components/room/InstallHint";
import ReceivingTile from "@/components/room/ReceivingTile";
import RoomStatePanel from "@/components/room/RoomStatePanel";
import SlideCard from "@/components/room/SlideCard";
import StatusBadge from "@/components/room/StatusBadge";
import { BoltIcon } from "@/components/layout/icons";
import { cueSlideReceived, downloadSlide, readAutoSave, writeAutoSave } from "@/lib/autoSave";
import { useRoomSession } from "@/lib/useRoomSession";
import {
  isEndedRoomError,
  ROOM_CLOSED_MESSAGE,
  ROOM_ENDED_MESSAGE,
  type SlidePayload,
} from "@/lib/roomEvents";
import {
  formatSlideTime,
  revokeSlide,
  slideFileName,
  slideFromPayload,
  type Slide,
} from "@/lib/slides";

type Props = {
  roomId: string;
  valid: boolean;
};

export default function TabletFeed({ roomId, valid }: Props) {
  const { status, presence, error, serverDown, subscribeSlides } = useRoomSession(
    roomId,
    "tablet",
    valid,
  );
  const [slides, setSlides] = useState<Slide[]>([]);
  const [autoSave, setAutoSave] = useState(false);
  const slidesRef = useRef<Slide[]>([]);
  const autoSaveRef = useRef(false);
  const savedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    setAutoSave(readAutoSave());
  }, []);

  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    if (status !== "connected") return;

    function onReceived(payload: SlidePayload) {
      const slide = slideFromPayload(payload);
      if (!slide) return;

      setSlides((prev) => {
        for (const item of prev) {
          if (item.id === slide.id) revokeSlide(item);
        }
        return [slide, ...prev.filter((item) => item.id !== slide.id)];
      });

      cueSlideReceived();

      if (autoSaveRef.current && !savedIdsRef.current.has(slide.id)) {
        savedIdsRef.current.add(slide.id);
        downloadSlide(slide.blob, slideFileName(slide.mime, slide.createdAt));
      }
    }

    return subscribeSlides(onReceived);
  }, [status, subscribeSlides]);

  useEffect(() => {
    return () => {
      for (const slide of slidesRef.current) revokeSlide(slide);
    };
  }, []);

  function onAutoSaveChange(next: boolean) {
    setAutoSave(next);
    writeAutoSave(next);
  }

  const roomMissing =
    !valid ||
    error?.code === "unknown_room" ||
    error?.code === "invalid_id" ||
    isEndedRoomError(error?.code) ||
    status === "ended";
  const roomFull = error?.code === "full";
  const reconnecting = valid && !roomMissing && !roomFull && (status === "disconnected" || serverDown);
  const inRoom = valid && status === "connected" && Boolean(presence) && !error && !serverDown;

  let statusTitle = "Connecting";
  let statusTone: "wait" | "ok" | "error" = "wait";
  let pulse = true;

  if (roomMissing) {
    statusTitle =
      error?.code === "expired" ? "Room ended" : error?.code === "closed" ? "Room closed" : "Room not found";
    statusTone = "error";
    pulse = false;
  } else if (roomFull) {
    statusTitle = "Room full";
    statusTone = "error";
    pulse = false;
  } else if (serverDown) {
    statusTitle = "Reconnecting";
    statusTone = "error";
    pulse = true;
  } else if (reconnecting) {
    statusTitle = "Reconnecting";
    statusTone = "wait";
    pulse = true;
  } else if (error) {
    statusTitle = "Error";
    statusTone = "error";
    pulse = false;
  } else if (inRoom) {
    statusTitle = "Connected";
    statusTone = "ok";
    pulse = false;
  }

  return (
    <div
      className="flex flex-col min-h-screen grain relative"
      style={{ background: "var(--bg-base)" }}
    >
      <header
        className="sticky top-0 z-50 safe-pad-top"
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

            <span className="ml-auto">
              <StatusBadge title={statusTitle} tone={statusTone} pulse={pulse} />
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
              <AutoSaveToggle on={autoSave} onChange={onAutoSaveChange} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5 safe-pad-bottom">
        <InstallHint />
        {roomMissing ? (
          <RoomStatePanel
            title={
              error?.code === "expired"
                ? ROOM_ENDED_MESSAGE
                : error?.code === "closed"
                  ? (error.message || ROOM_CLOSED_MESSAGE)
                  : "Room not found — create one on the laptop."
            }
            detail={
              error?.code === "expired"
                ? "This room timed out. Open Snipio on the laptop and create a new one."
                : error?.code === "closed"
                  ? "Ask the host to create a new room, then join with the new code."
                  : (error?.message ??
                    "This room isn’t active. Open Snipio on your laptop and create a room first.")
            }
          />
        ) : roomFull ? (
          <RoomStatePanel
            title="This room is full"
            detail={error?.message ?? "At most two tablets can join. Ask the host to leave a device, or create a new room."}
          />
        ) : reconnecting && slides.length === 0 ? (
          <RoomStatePanel
            tone="wait"
            title={serverDown ? "Can’t reach the room server" : "Disconnected"}
            detail={
              serverDown
                ? "Keep npm run dev running, stay on the same Wi‑Fi, and leave this page open — it will reconnect."
                : "Reconnecting. Slides already on this tablet stay here; new ones arrive after you’re back."
            }
          />
        ) : error && !inRoom ? (
          <RoomStatePanel title="Couldn’t join room" detail={error.message} />
        ) : slides.length === 0 ? (
          <EmptyFeed connecting={!inRoom} autoSave={autoSave} />
        ) : (
          <>
            {reconnecting ? (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{
                  background: serverDown ? "rgba(220, 53, 69, 0.06)" : "var(--accent-softer)",
                  border: serverDown
                    ? "1px solid rgba(220, 53, 69, 0.28)"
                    : "1px solid rgba(232, 100, 42, 0.28)",
                }}
              >
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {serverDown ? "Can’t reach the room server" : "Disconnected"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Reconnecting. Slides already here stay on this tablet.
                </p>
              </div>
            ) : null}
            <ul className="flex flex-col gap-3">
              {slides.map((slide, index) => (
                <li key={slide.id}>
                  <SlideCard
                    id={slide.id}
                    name={slideFileName(slide.mime, slide.createdAt)}
                    time={formatSlideTime(slide.createdAt)}
                    src={slide.objectUrl}
                    mime={slide.mime}
                    blob={slide.blob}
                    newest={index === 0}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyFeed({ connecting, autoSave }: { connecting: boolean; autoSave: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {connecting ? <ReceivingTile label="connecting…" /> : <ReceivingTile />}
      <div
        className="rounded-2xl px-5 py-10 text-center"
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
          Drop or paste on the laptop, or press Alt+S and drag a region.
        </p>
        <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          {connecting
            ? "Connecting to the room…"
            : autoSave
              ? "Auto-save is on — new slides download to this device."
              : "Copy, drag into Notes, or turn on Auto-save."}
        </p>
      </div>
    </div>
  );
}
