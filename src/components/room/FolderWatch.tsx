"use client";

import { useEffect, useRef, useState } from "react";
import { FolderIcon } from "@/components/layout/icons";
import {
  canPickDirectory,
  isFileStable,
  listScreenshotFiles,
  pickScreenshotDirectory,
  screenshotFileKey,
  toSendableImage,
  watchDirectory,
  withScreenshotMime,
} from "@/lib/folderWatch";

type Props = {
  canSend: boolean;
  ingestFiles: (files: File[]) => Promise<boolean>;
};

type WatchState =
  | { kind: "unsupported" }
  | { kind: "idle" }
  | { kind: "watching"; folder: string }
  | { kind: "error"; message: string };

export default function FolderWatch({ canSend, ingestFiles }: Props) {
  const [state, setState] = useState<WatchState>(() =>
    canPickDirectory() ? { kind: "idle" } : { kind: "unsupported" },
  );
  const [lastSent, setLastSent] = useState<string | null>(null);

  const dirRef = useRef<FileSystemDirectoryHandle | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const seenRef = useRef(new Set<string>());
  const pendingRef = useRef(new Set<string>());
  const scanningRef = useRef(false);
  const canSendRef = useRef(canSend);
  const ingestRef = useRef(ingestFiles);

  useEffect(() => {
    canSendRef.current = canSend;
  }, [canSend]);

  useEffect(() => {
    ingestRef.current = ingestFiles;
  }, [ingestFiles]);

  useEffect(() => {
    return () => stopWatching();
  }, []);

  function stopWatching() {
    stopRef.current?.();
    stopRef.current = null;
    dirRef.current = null;
    seenRef.current = new Set();
    pendingRef.current = new Set();
  }

  async function scan() {
    const dir = dirRef.current;
    if (!dir || scanningRef.current) return;
    scanningRef.current = true;

    try {
      const listed = await listScreenshotFiles(dir);
      const ready: { file: File; key: string }[] = [];

      for (const raw of listed) {
        const file = withScreenshotMime(raw);
        const key = screenshotFileKey(file);
        if (seenRef.current.has(key) || pendingRef.current.has(key)) continue;
        if (!isFileStable(file)) continue;
        if (!canSendRef.current) continue;

        pendingRef.current.add(key);
        try {
          ready.push({ file: await toSendableImage(file), key });
        } catch {
          pendingRef.current.delete(key);
        }
      }

      if (ready.length === 0) return;

      try {
        const ok = await ingestRef.current(ready.map((item) => item.file));
        if (ok) {
          for (const item of ready) seenRef.current.add(item.key);
          setLastSent(ready[ready.length - 1]?.file.name ?? null);
        }
      } finally {
        for (const item of ready) pendingRef.current.delete(item.key);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lost access to that folder.";
      stopWatching();
      setState({ kind: "error", message });
    } finally {
      scanningRef.current = false;
    }
  }

  async function startWatching() {
    if (!canPickDirectory()) {
      setState({ kind: "unsupported" });
      return;
    }

    try {
      const dir = await pickScreenshotDirectory();
      stopWatching();
      dirRef.current = dir;

      const existing = await listScreenshotFiles(dir);
      seenRef.current = new Set(existing.map((file) => screenshotFileKey(withScreenshotMime(file))));

      stopRef.current = watchDirectory(dir, () => {
        void scan();
      });
      setLastSent(null);
      setState({ kind: "watching", folder: dir.name });
    } catch (err) {
      if (isAbort(err)) return;
      setState({
        kind: "error",
        message: "Couldn’t open that folder. Try Chrome or Edge, and pick Desktop or Screenshots.",
      });
    }
  }

  function onStop() {
    stopWatching();
    setLastSent(null);
    setState({ kind: "idle" });
  }

  const watching = state.kind === "watching";

  return (
    <section
      className="rounded-2xl px-5 py-4"
      style={{
        background: "var(--bg-elevated)",
        border: watching ? "1px solid rgba(39, 160, 90, 0.28)" : "1px solid var(--bg-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: watching ? "var(--success-soft)" : "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
            color: watching ? "var(--success)" : "var(--text-secondary)",
          }}
        >
          <FolderIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Watch screenshot folder
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Choose Desktop or the folder your OS saves screenshots to. Use this for apps outside Chrome;
            use Alt+S in the lecture tab.
          </p>
        </div>
      </div>

      {state.kind === "unsupported" ? (
        <p className="text-xs mt-3" style={{ color: "var(--text-secondary)" }}>
          Folder watching needs Chrome or Edge on this laptop.
        </p>
      ) : null}

      {state.kind === "error" ? (
        <p className="text-xs mt-3" style={{ color: "var(--error)" }}>
          {state.message}
        </p>
      ) : null}

      {watching ? (
        <p className="text-xs mt-3" style={{ color: "var(--success)" }}>
          Watching “{state.folder}”
          {canSend
            ? " — new PNG/JPEG files send automatically."
            : " — connect to the room to send new files."}
          {lastSent ? ` Last sent: ${lastSent}` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 mt-3.5">
        <button
          type="button"
          onClick={() => void startWatching()}
          disabled={state.kind === "unsupported"}
          className="inline-flex items-center justify-center min-h-10 px-3.5 text-sm font-medium rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: watching ? "var(--bg-surface)" : "var(--accent)",
            color: watching ? "var(--text-secondary)" : "#fff",
            border: watching ? "1px solid var(--bg-border)" : "none",
          }}
        >
          {watching ? "Change folder" : "Choose folder"}
        </button>
        {watching ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center justify-center min-h-10 px-3.5 text-sm font-medium rounded-xl cursor-pointer"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--bg-border)",
            }}
          >
            Stop
          </button>
        ) : null}
      </div>
    </section>
  );
}

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}
