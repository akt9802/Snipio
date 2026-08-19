export type CopyImageResult = "copied" | "unsupported" | "denied";

function clipboardType(blob: Blob): string {
  return blob.type || "image/png";
}

export async function copyImageBlob(blob: Blob): Promise<CopyImageResult> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    return "unsupported";
  }

  const type = clipboardType(blob);
  const payload = blob.type ? blob : new Blob([blob], { type });

  try {
    await navigator.clipboard.write([new ClipboardItem({ [type]: payload })]);
    return "copied";
  } catch {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [type]: Promise.resolve(payload),
        }),
      ]);
      return "copied";
    } catch {
      return "denied";
    }
  }
}

export function copyImageMessage(result: CopyImageResult): string {
  if (result === "copied") return "Copied — paste into Notes";
  if (result === "unsupported") return "Copy isn’t supported here — use Download";
  return "Couldn’t copy — try Download or Auto-save";
}
