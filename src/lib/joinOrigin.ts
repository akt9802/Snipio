import { roomPath } from "@/lib/roomId";

export function stripTrailingSlash(origin: string) {
  return origin.replace(/\/$/, "");
}

export function isLoopbackHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

export function tabletJoinUrl(origin: string, roomId: string) {
  return `${stripTrailingSlash(origin)}${roomPath(roomId, "tablet")}`;
}

export function envJoinOrigin() {
  const value = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  return value ? stripTrailingSlash(value) : null;
}

/** Production: window.origin. Localhost: env override, else LAN IP from the API. */
export async function resolveJoinOrigin(): Promise<string> {
  const configured = envJoinOrigin();
  if (configured) return configured;
  if (typeof window === "undefined") return "";

  if (!isLoopbackHost(window.location.hostname)) {
    return window.location.origin;
  }

  try {
    const response = await fetch("/api/lan-origin");
    if (response.ok) {
      const data = (await response.json()) as { origin?: string };
      if (data.origin) return stripTrailingSlash(data.origin);
    }
  } catch {
    // Fall back to the current origin (localhost QR will not work on a tablet).
  }

  return window.location.origin;
}
