import Link from "next/link";
import { BoltIcon } from "@/components/layout/icons";

export const metadata = {
  title: "Offline — Snipio",
};

export default function OfflinePage() {
  return (
    <div
      className="flex flex-col min-h-screen grain relative items-center justify-center px-6"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl px-6 py-10 text-center"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <span
          className="w-12 h-12 rounded-[14px] inline-flex items-center justify-center mb-5"
          style={{ background: "var(--accent)", boxShadow: "0 4px 10px rgba(232,100,42,0.28)" }}
        >
          <BoltIcon className="w-5 h-5 text-white" />
        </span>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          You’re offline
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Snipio needs a network to join a room and receive slides. Connect to Wi‑Fi and try again.
        </p>
        <Link
          href="/"
          className="btn-primary inline-flex items-center justify-center min-h-11 px-5 mt-6 rounded-xl text-sm font-semibold"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
