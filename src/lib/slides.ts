import {
  isAllowedSlideMime,
  MAX_SLIDE_BYTES,
  type AllowedSlideMime,
  type SlidePayload,
} from "@/lib/roomEvents";

export {
  ALLOWED_SLIDE_MIMES,
  isAllowedSlideMime,
  MAX_SLIDE_BYTES,
  type AllowedSlideMime,
} from "@/lib/roomEvents";

export type Slide = {
  id: string;
  mime: AllowedSlideMime;
  createdAt: number;
  blob: Blob;
  objectUrl: string;
};

export type SlideReadError = "unsupported_type" | "too_large" | "empty";

export function createSlideId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function fileExtension(mime: string): "png" | "jpg" {
  return mime === "image/jpeg" ? "jpg" : "png";
}

export function slideFileName(mime: string, createdAt: number): string {
  const time = new Date(createdAt);
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  return `slide_${hh}${mm}${ss}.${fileExtension(mime)}`;
}

export function formatSlideTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function validateSlideFile(file: Blob): SlideReadError | null {
  if (!isAllowedSlideMime(file.type)) return "unsupported_type";
  if (file.size <= 0) return "empty";
  if (file.size > MAX_SLIDE_BYTES) return "too_large";
  return null;
}

export function slideReadMessage(error: SlideReadError): string {
  if (error === "unsupported_type") return "PNG or JPEG only.";
  if (error === "too_large") return "Image is too large (max 5 MB).";
  return "That file is empty.";
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function fileToSlidePayload(file: Blob): Promise<SlidePayload> {
  const error = validateSlideFile(file);
  if (error) throw new Error(error);
  return {
    id: createSlideId(),
    mime: file.type,
    bytes: await blobToBase64(file),
    createdAt: Date.now(),
  };
}

export function slideFromPayload(payload: SlidePayload): Slide | null {
  if (!isAllowedSlideMime(payload.mime) || !payload.id || !payload.bytes) return null;
  const blob = base64ToBlob(payload.bytes, payload.mime);
  return {
    id: payload.id,
    mime: payload.mime,
    createdAt: payload.createdAt,
    blob,
    objectUrl: URL.createObjectURL(blob),
  };
}

export function slideFromLocalFile(file: Blob, id: string, createdAt: number): Slide | null {
  if (!isAllowedSlideMime(file.type)) return null;
  return {
    id,
    mime: file.type,
    createdAt,
    blob: file,
    objectUrl: URL.createObjectURL(file),
  };
}

export function revokeSlide(slide: Slide) {
  URL.revokeObjectURL(slide.objectUrl);
}

export function imageFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.kind === "file" && isAllowedSlideMime(item.type)) {
      return item.getAsFile();
    }
  }
  return null;
}

export function imagesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  return [...data.files].filter((file) => isAllowedSlideMime(file.type));
}
