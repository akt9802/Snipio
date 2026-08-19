"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckIcon, CloseIcon, CopyIcon, DownloadIcon } from "@/components/layout/icons";
import { downloadSlide } from "@/lib/autoSave";
import { copyImageBlob, copyImageMessage } from "@/lib/clipboard";

export type SlideCardProps = {
  id: string;
  name: string;
  time: string;
  src: string;
  mime: string;
  blob: Blob;
};

export default function SlideCard({ name, time, src, mime, blob }: SlideCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => {
      setCopyState("idle");
      setCopyHint(null);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  useEffect(() => {
    if (!previewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOpen]);

  async function copy() {
    const result = await copyImageBlob(blob);
    setCopyHint(copyImageMessage(result));
    setCopyState(result === "copied" ? "copied" : "error");
  }

  function download() {
    downloadSlide(blob, name);
  }

  function onDragStart(event: DragEvent<HTMLElement>) {
    draggingRef.current = true;
    const file = new File([blob], name, { type: mime || blob.type || "image/png" });
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", name);
    event.dataTransfer.setData("text/uri-list", src);
    event.dataTransfer.setData("DownloadURL", `${file.type}:${name}:${src}`);
    try {
      event.dataTransfer.items.add(file);
    } catch {
      // Some WebViews only accept setData, not File items.
    }
  }

  return (
    <>
      <article
        className="overflow-hidden rounded-xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          draggable
          onDragStart={onDragStart}
          onClick={() => {
            if (draggingRef.current) {
              draggingRef.current = false;
              return;
            }
            setPreviewOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setPreviewOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`View ${name} full screen`}
          className="relative bg-[var(--bg-surface)] cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            draggable={false}
            className="block w-full h-auto max-h-[70vh] object-contain mx-auto pointer-events-none"
          />
        </div>

        <div className="px-3 py-2.5" style={{ borderTop: "1px solid var(--bg-border)" }}>
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {name}
          </p>
          <p className="text-[11px] mt-0.5 code-font" style={{ color: "var(--text-muted)" }}>
            {time}
            <span className="ml-2 font-sans tracking-normal">Drag into Notes</span>
          </p>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 flex-1 px-3 rounded-xl text-sm font-semibold cursor-pointer"
              style={{
                background: copyState === "copied" ? "var(--success)" : "var(--accent)",
                color: "#fff",
              }}
            >
              {copyState === "copied" ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center justify-center min-h-11 min-w-11 px-3 rounded-xl cursor-pointer"
              aria-label={`Download ${name}`}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-secondary)",
              }}
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
          </div>

          {copyHint ? (
            <p
              className="text-[11px] mt-2"
              style={{ color: copyState === "error" ? "var(--error)" : "var(--success)" }}
            >
              {copyHint}
            </p>
          ) : null}
        </div>
      </article>

      {previewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          className="fixed inset-0 z-[80] flex flex-col"
          style={{ background: "rgba(26, 23, 20, 0.88)" }}
        >
          <div className="flex items-center gap-2 px-4 py-3">
            <p className="text-sm font-medium truncate min-w-0" style={{ color: "#FAF8F5" }}>
              {name}
            </p>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="ml-auto inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl cursor-pointer"
              aria-label="Close preview"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            className="flex-1 min-h-0 flex items-center justify-center px-4 cursor-zoom-out"
            onClick={() => setPreviewOpen(false)}
            aria-label="Close preview"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              draggable={false}
              className="max-w-full max-h-full object-contain"
            />
          </button>

          <div className="flex gap-2 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 flex-1 px-3 rounded-xl text-sm font-semibold cursor-pointer"
              style={{
                background: copyState === "copied" ? "var(--success)" : "#fff",
                color: copyState === "copied" ? "#fff" : "var(--text-primary)",
              }}
            >
              {copyState === "copied" ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            >
              <DownloadIcon className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
