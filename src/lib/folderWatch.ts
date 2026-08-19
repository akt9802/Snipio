export function canPickDirectory(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

export function isScreenshotFileName(name: string): boolean {
  if (!name || name.startsWith(".") || name.startsWith("~$")) return false;
  return /\.(png|jpe?g|webp)$/i.test(name);
}

export function screenshotMimeFromName(name: string): "image/png" | "image/jpeg" | "image/webp" | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

export function withScreenshotMime(file: File): File {
  const fromName = screenshotMimeFromName(file.name);
  if (!fromName) return file;
  if (file.type === fromName) return file;
  return new File([file], file.name, { type: fromName, lastModified: file.lastModified });
}

export function screenshotFileKey(file: File): string {
  return `${file.name}:${file.lastModified}:${file.size}`;
}

export function isFileStable(file: File, now = Date.now()): boolean {
  if (file.size <= 0) return false;
  return now - file.lastModified >= 450;
}

export async function listScreenshotFiles(dir: FileSystemDirectoryHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== "file") continue;
    if (!isScreenshotFileName(name)) continue;
    try {
      files.push(await (handle as FileSystemFileHandle).getFile());
    } catch {
      // File vanished or permission was revoked.
    }
  }
  return files;
}

export async function toSendableImage(file: File): Promise<File> {
  const typed = withScreenshotMime(file);
  if (typed.type === "image/png" || typed.type === "image/jpeg") return typed;
  if (typed.type === "image/webp") return webpToPngFile(typed);
  throw new Error("unsupported");
}

export async function pickScreenshotDirectory(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker({
    id: "snipio-screenshots",
    mode: "read",
    startIn: "desktop",
  });
}

type WatchStop = () => void;

export function watchDirectory(dir: FileSystemDirectoryHandle, onTick: () => void): WatchStop {
  let stopped = false;

  const tick = () => {
    if (!stopped) onTick();
  };

  const observer = startFileSystemObserver(dir, tick);
  const poll = window.setInterval(tick, 1400);

  document.addEventListener("visibilitychange", tick);

  return () => {
    stopped = true;
    window.clearInterval(poll);
    document.removeEventListener("visibilitychange", tick);
    observer?.disconnect();
  };
}

type ObserverLike = { observe: (handle: FileSystemHandle) => unknown; disconnect: () => void };

function startFileSystemObserver(dir: FileSystemDirectoryHandle, onTick: () => void): ObserverLike | null {
  const Observer = (window as unknown as { FileSystemObserver?: new (cb: () => void) => ObserverLike })
    .FileSystemObserver;
  if (!Observer) return null;
  try {
    const observer = new Observer(onTick);
    void Promise.resolve(observer.observe(dir));
    return observer;
  } catch {
    return null;
  }
}

async function webpToPngFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas");
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("png"))), "image/png");
  });
  return new File([blob], file.name.replace(/\.webp$/i, ".png"), {
    type: "image/png",
    lastModified: file.lastModified,
  });
}
