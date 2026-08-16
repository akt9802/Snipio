import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import HostDashboard from "@/components/room/HostDashboard";
import TabletFeed from "@/components/room/TabletFeed";
import { isValidRoomId, normalizeRoomId } from "@/lib/roomId";

export async function generateMetadata({
  params,
}: PageProps<"/room/[roomId]">): Promise<Metadata> {
  const { roomId } = await params;
  return { title: `Room ${decodeURIComponent(roomId)} — Snipio` };
}

function roleFromQuery(
  role: string | string[] | undefined,
): "host" | "tablet" {
  return role === "host" ? "host" : "tablet";
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
  const displayId = valid ? roomId : decodeURIComponent(rawId);

  if (role === "host") {
    return (
      <div
        className="flex flex-col min-h-screen grain relative"
        style={{ background: "var(--bg-base)" }}
      >
        <Navbar />
        <main className="flex-1 hero-glow">
          <HostDashboard key={displayId} roomId={displayId} valid={valid} />
        </main>
      </div>
    );
  }

  return <TabletFeed key={displayId} roomId={displayId} valid={valid} />;
}
