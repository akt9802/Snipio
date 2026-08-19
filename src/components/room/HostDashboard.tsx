"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  CheckIcon,
  CopyIcon,
  ExtensionIcon,
  MonitorIcon,
  PaperclipIcon,
  TabletIcon,
} from "@/components/layout/icons";
import JoinQr from "@/components/room/JoinQr";
import { useRoomSession } from "@/lib/useRoomSession";
import type { DeviceRole, RoomDevice, SlidePayload } from "@/lib/roomEvents";
import {
  fileToSlidePayload,
  formatSlideTime,
  imageFromClipboard,
  imagesFromDataTransfer,
  isAllowedSlideMime,
  revokeSlide,
  slideFileName,
  slideFromLocalFile,
  slideReadMessage,
  validateSlideFile,
  type Slide,
} from "@/lib/slides";

type Props = {
  roomId: string;
  valid: boolean;
};

function deviceLabel(count: number) {
  return count === 1 ? "1 device" : `${count} devices`;
}

function roleMeta(role: DeviceRole) {
  if (role === "tablet") {
    return { label: "Tablet", hint: "Receiver", Icon: TabletIcon };
  }
  if (role === "extension") {
    return { label: "Extension", hint: "Capture", Icon: ExtensionIcon };
  }
  return { label: "This laptop", hint: "Host", Icon: MonitorIcon };
}

export default function HostDashboard({ roomId, valid }: Props) {
  const { status, presence, error, serverDown, sendSlide } = useRoomSession(roomId, "host", valid);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const tabletConnected = presence?.devices.some((device) => device.role === "tablet") ?? false;
  const extensionConnected = presence?.devices.some((device) => device.role === "extension") ?? false;
  const deviceCount = presence?.deviceCount ?? 0;
  const devices = presence?.devices ?? [];
  const canSend = valid && status === "connected" && Boolean(presence) && !error && !serverDown;

  let statusTitle = "Connecting…";
  let statusDetail = "Claiming this room";
  let statusTone: "wait" | "ok" | "error" = "wait";

  if (!valid) {
    statusTitle = "Invalid room code";
    statusDetail = "Use a code like DBMS-4821";
    statusTone = "error";
  } else if (serverDown) {
    statusTitle = "Room server offline";
    statusDetail = "Keep npm run dev running";
    statusTone = "error";
  } else if (error) {
    statusTitle = "Couldn’t stay in the room";
    statusDetail = error.message;
    statusTone = "error";
  } else if (status === "connected" && presence) {
    if (tabletConnected && extensionConnected) {
      statusTitle = "Ready · tablet + extension";
      statusDetail = deviceLabel(deviceCount);
      statusTone = "ok";
    } else if (tabletConnected) {
      statusTitle = "Ready · tablet connected";
      statusDetail = deviceLabel(deviceCount);
      statusTone = "ok";
    } else if (extensionConnected) {
      statusTitle = "Extension connected";
      statusDetail = "Scan the QR to also pair a tablet";
      statusTone = "ok";
    } else {
      statusTitle = "Waiting for tablet";
      statusDetail = "Scan the QR to pair";
      statusTone = "wait";
    }
  } else if (status === "disconnected") {
    statusTitle = "Disconnected";
    statusDetail = "Reconnecting if the server is up";
  }

  const statusDot =
    statusTone === "ok" ? "var(--success)" : statusTone === "error" ? "var(--error)" : "var(--accent)";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="page-wrap py-6 md:py-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
        <aside className="anim-fade-up lg:sticky lg:top-24">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-border)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid var(--bg-border)" }}>
              <span
                className={status === "connecting" && statusTone === "wait" ? "dot-pulse" : ""}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: statusDot,
                  flexShrink: 0,
                }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {statusTitle}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {statusDetail}
                </p>
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--bg-border)" }}>
              <p
                className="text-[10px] font-medium uppercase tracking-[0.14em] mb-2.5"
                style={{ color: "var(--text-muted)" }}
              >
                Room
              </p>
              <div className="flex items-center gap-2">
                <p
                  className="code-font text-[22px] font-bold tracking-[0.14em] leading-none truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {roomId}
                </p>
                <button
                  type="button"
                  onClick={copyCode}
                  className="ml-auto inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg border cursor-pointer flex-shrink-0"
                  style={{
                    color: copied ? "var(--success)" : "var(--text-secondary)",
                    borderColor: copied ? "rgba(39, 160, 90, 0.35)" : "var(--bg-border)",
                    background: copied ? "var(--success-soft)" : "var(--bg-surface)",
                  }}
                >
                  {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--bg-border)" }}>
              <p
                className="text-[10px] font-medium uppercase tracking-[0.14em] mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                Pair tablet
              </p>
              <JoinQr roomId={roomId} valid={valid} compact />
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Devices
                </p>
                <p className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {deviceCount}
                </p>
              </div>
              {devices.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No devices yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {devices.map((device) => (
                    <DeviceRow key={device.id} device={device} />
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-4" style={{ borderTop: "1px solid var(--bg-border)" }}>
              <Link
                href="/"
                className="flex items-center justify-center min-h-10 rounded-xl text-sm font-medium"
                style={{
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--bg-border)",
                }}
              >
                Back home
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 anim-fade-up delay-1">
          <HostDropzone sendSlide={sendSlide} canSend={canSend} />
        </div>
      </div>
    </div>
  );
}

type DropState =
  | { kind: "idle" }
  | { kind: "dragging" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

function HostDropzone({
  sendSlide,
  canSend,
}: {
  sendSlide: (payload: SlidePayload) => boolean;
  canSend: boolean;
}) {
  const [state, setState] = useState<DropState>({ kind: "idle" });
  const [sentSlides, setSentSlides] = useState<Slide[]>([]);
  const [sendOnPaste, setSendOnPaste] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const dragDepthRef = useRef(0);
  const sentSlidesRef = useRef<Slide[]>([]);
  const sendOnPasteRef = useRef(sendOnPaste);

  useEffect(() => {
    sendOnPasteRef.current = sendOnPaste;
  }, [sendOnPaste]);

  useEffect(() => {
    sentSlidesRef.current = sentSlides;
  }, [sentSlides]);

  useEffect(() => {
    return () => {
      for (const slide of sentSlidesRef.current) revokeSlide(slide);
    };
  }, []);

  const ingestFiles = useCallback(
    async (files: File[]) => {
      if (sendingRef.current) return;

      const images = files.filter((file) => isAllowedSlideMime(file.type));
      if (images.length === 0) {
        setState({ kind: "error", message: "PNG or JPEG only." });
        return;
      }

      if (!canSend) {
        setState({ kind: "error", message: "Connect to the room first." });
        return;
      }

      sendingRef.current = true;
      setState({ kind: "sending" });

      try {
        for (const file of images) {
          const problem = validateSlideFile(file);
          if (problem) {
            setState({ kind: "error", message: slideReadMessage(problem) });
            return;
          }
          const payload = await fileToSlidePayload(file);
          if (!sendSlide(payload)) {
            setState({ kind: "error", message: "Connect to the room first." });
            return;
          }
          const local = slideFromLocalFile(file, payload.id, payload.createdAt);
          if (local) {
            setSentSlides((prev) => [local, ...prev]);
          }
          setState({ kind: "sent" });
        }
      } catch {
        setState({ kind: "error", message: "Couldn’t read that image." });
      } finally {
        sendingRef.current = false;
      }
    },
    [canSend, sendSlide],
  );

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (!sendOnPasteRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      const file = imageFromClipboard(event);
      if (!file) return;
      event.preventDefault();
      void ingestFiles([file]);
    }

    function hasFiles(event: globalThis.DragEvent) {
      return event.dataTransfer?.types.includes("Files") ?? false;
    }

    function onDragEnter(event: globalThis.DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setState((current) => (current.kind === "sending" ? current : { kind: "dragging" }));
    }

    function onDragOver(event: globalThis.DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
    }

    function onDragLeave(event: globalThis.DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setState((current) => (current.kind === "dragging" ? { kind: "idle" } : current));
      }
    }

    function onDrop(event: globalThis.DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      const images = imagesFromDataTransfer(event.dataTransfer);
      void ingestFiles(images);
    }

    window.addEventListener("paste", onPaste);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [ingestFiles]);

  function onZoneDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    void ingestFiles(imagesFromDataTransfer(event.dataTransfer));
  }

  function openPicker() {
    if (sendingRef.current) return;
    inputRef.current?.click();
  }

  const dragging = state.kind === "dragging";
  const sending = state.kind === "sending";
  const errored = state.kind === "error";
  const sentCount = sentSlides.length;

  let prompt = "Drop, paste, or choose a screenshot…";
  let promptColor = "var(--text-placeholder)";

  if (sending) {
    prompt = "Sending to tablet…";
    promptColor = "var(--text-secondary)";
  } else if (errored) {
    prompt = state.message;
    promptColor = "var(--error)";
  } else if (dragging) {
    prompt = "Drop to send";
    promptColor = "var(--accent)";
  } else if (!canSend) {
    prompt = "Connect to the room, then drop or paste a screenshot…";
  }

  return (
    <div className="flex flex-col gap-5">
      <section
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-elevated)",
          border: dragging ? "1px solid rgba(232, 100, 42, 0.45)" : "1px solid var(--bg-border)",
          boxShadow: dragging ? "var(--shadow-md)" : "var(--shadow-sm)",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            void ingestFiles(files);
          }}
        />

        <div
          className="px-6 py-14 md:px-8 md:py-16 text-center cursor-text"
          style={{
            background: dragging ? "var(--accent-softer)" : "transparent",
            minHeight: 200,
            transition: "background 0.15s ease",
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onZoneDrop}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Drop, paste, or choose a PNG or JPEG to send to the tablet"
        >
          <p className="text-lg md:text-xl font-medium tracking-tight" style={{ color: promptColor }}>
            {prompt}
          </p>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderTop: "1px solid var(--bg-border)" }}
        >
          <button
            type="button"
            role="switch"
            aria-checked={sendOnPaste}
            aria-label="Send on paste"
            onClick={() => setSendOnPaste((value) => !value)}
            className="inline-flex items-center gap-2.5 text-xs font-medium cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            <span
              aria-hidden
              className="relative flex-shrink-0"
              style={{
                width: 32,
                height: 18,
                borderRadius: 999,
                background: sendOnPaste ? "var(--success)" : "var(--bg-overlay)",
                transition: "background 0.15s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: sendOnPaste ? 16 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "#fff",
                  boxShadow: "var(--shadow-sm)",
                  transition: "left 0.15s ease",
                }}
              />
            </span>
            Send on paste
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openPicker();
            }}
            disabled={sending}
            className="ml-auto inline-flex items-center justify-center gap-2 min-h-10 px-3.5 text-sm font-medium rounded-xl cursor-pointer disabled:opacity-50"
            style={{
              color: "var(--text-secondary)",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-border)",
            }}
          >
            <PaperclipIcon className="w-4 h-4" />
            Choose file
          </button>
        </div>
      </section>

      {sentCount > 0 ? (
        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3 px-0.5">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: "var(--text-muted)" }}
            >
              Sent this session
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {sentCount === 1 ? "1 slide" : `${sentCount} slides`} · newest first
            </p>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sentSlides.map((slide, index) => (
              <li key={slide.id}>
                <SentSlideThumb slide={slide} newest={index === 0} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyRoom />
      )}
    </div>
  );
}

function EmptyRoom() {
  const stroke = "rgba(26,23,20,0.28)";
  const fill = "rgba(255,255,255,0.85)";

  return (
    <div
      className="rounded-2xl px-6 py-14 text-center"
      style={{
        border: "1px dashed var(--bg-border)",
        background: "transparent",
      }}
    >
      <svg viewBox="0 0 120 64" className="w-28 h-14 mx-auto mb-5" aria-hidden>
        <rect x="6" y="10" width="58" height="38" rx="4" fill={fill} stroke={stroke} />
        <rect x="10" y="14" width="50" height="26" rx="2" fill="rgba(232,100,42,0.08)" stroke={stroke} />
        <path d="M24 54h22" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <rect x="74" y="8" width="38" height="48" rx="5" fill={fill} stroke={stroke} />
        <rect x="78" y="14" width="30" height="32" rx="2" fill="rgba(232,100,42,0.08)" stroke={stroke} />
        <circle cx="93" cy="50" r="1.6" fill={stroke} />
      </svg>
      <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        Your room is empty
      </p>
      <p className="text-sm mt-1.5 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
        Send from this laptop — or pair a tablet and drop a screenshot to see it there instantly.
      </p>
    </div>
  );
}

function SentSlideThumb({ slide, newest }: { slide: Slide; newest: boolean }) {
  const name = slideFileName(slide.mime, slide.createdAt);
  const time = formatSlideTime(slide.createdAt);

  return (
    <article
      className={newest ? "anim-fade-up overflow-hidden rounded-xl" : "overflow-hidden rounded-xl"}
      style={{
        background: "var(--bg-elevated)",
        border: newest ? "1px solid rgba(39, 160, 90, 0.28)" : "1px solid var(--bg-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="aspect-[16/10] flex items-center justify-center overflow-hidden"
        style={{ background: "var(--bg-surface)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.objectUrl} alt={name} className="max-w-full max-h-full object-contain" />
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {name}
        </p>
        <p className="text-[10px] mt-0.5 code-font" style={{ color: newest ? "var(--success)" : "var(--text-muted)" }}>
          {newest ? `Just sent · ${time}` : time}
        </p>
      </div>
    </article>
  );
}

function DeviceRow({ device }: { device: RoomDevice }) {
  const { label, hint, Icon } = roleMeta(device.role);

  return (
    <li className="flex items-center gap-2.5 rounded-xl px-2 py-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      </div>
    </li>
  );
}
