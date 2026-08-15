import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import RoomPresence from "@/components/RoomPresence";
import { MonitorIcon, TabletIcon } from "@/components/icons";
import { isValidRoomId, normalizeRoomId } from "@/lib/roomId";

export async function generateMetadata({
  params,
}: PageProps<"/room/[roomId]">): Promise<Metadata> {
  const { roomId } = await params;
  return { title: `Room ${decodeURIComponent(roomId)} — Snipio` };
}

function roleFromQuery(
  role: string | string[] | undefined,
): "host" | "tablet" | "unknown" {
  const value = Array.isArray(role) ? role[0] : role;
  if (value === "host") return "host";
  if (value === "tablet") return "tablet";
  return "unknown";
}

export default async function RoomPage({
  params,
  searchParams,
}: PageProps<"/room/[roomId]">) {
  const { roomId: rawId } = await params;
  const query = await searchParams;
  const roomId = normalizeRoomId(decodeURIComponent(rawId));
  const role = roleFromQuery(query.role);
  const valid = isValidRoomId(roomId);

  const roleLabel =
    role === "host" ? "Host" : role === "tablet" ? "Tablet" : "Device";
  const RoleIcon = role === "tablet" ? TabletIcon : MonitorIcon;

  return (
    <div
      className="flex flex-col min-h-screen grain relative"
      style={{ background: "var(--bg-base)" }}
    >
      <Navbar />

      <main className="flex-1 flex items-center justify-center hero-glow">
        <div className="page-wrap py-16 w-full flex justify-center">
          <div
            className="w-full max-w-md overflow-hidden anim-fade-up"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between gap-3"
              style={{
                background: "var(--bg-surface)",
                borderBottom: "1px solid var(--bg-border)",
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Room
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid rgba(232,100,42,0.18)",
                }}
              >
                <RoleIcon className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>

            <div className="p-8 flex flex-col items-center text-center gap-5">
              <p
                className="code-font text-3xl sm:text-4xl font-bold tracking-[0.18em]"
                style={{ color: "var(--text-primary)" }}
              >
                {valid ? roomId : decodeURIComponent(rawId)}
              </p>

              <p
                className="text-sm leading-relaxed max-w-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {role === "tablet"
                  ? "You’re in as the tablet. Slides from the laptop will show up here."
                  : role === "host"
                    ? "You’re the host. Share this code with your tablet to connect."
                    : "You’re in this room. Open it as host or tablet from the home page."}
              </p>

              <RoomPresence
                key={`${roomId}-${role}`}
                roomId={valid ? roomId : decodeURIComponent(rawId)}
                role={role}
                valid={valid}
              />

              <Link
                href="/"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--accent)" }}
              >
                ← Back home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
