"use client";

import Link from "next/link";
import CreateRoomButton from "@/components/landing/CreateRoomButton";

type Props = {
  title: string;
  detail: string;
  tone?: "error" | "wait";
  homeLabel?: string;
  showCreate?: boolean;
};

export default function RoomStatePanel({
  title,
  detail,
  tone = "error",
  homeLabel = "Back home",
  showCreate = false,
}: Props) {
  const isError = tone === "error";
  const homeClass = showCreate
    ? "inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold"
    : "btn-primary inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold";

  return (
    <div
      className="rounded-2xl px-5 py-10 text-center"
      style={{
        background: isError ? "rgba(220, 53, 69, 0.06)" : "var(--bg-elevated)",
        border: isError ? "1px solid rgba(220, 53, 69, 0.28)" : "1px dashed var(--bg-border)",
        boxShadow: isError ? "none" : "var(--shadow-sm)",
      }}
    >
      <p className="text-base font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {detail}
      </p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 mt-6">
        {showCreate ? (
          <CreateRoomButton className="btn-primary inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold cursor-pointer">
            Create a new room
          </CreateRoomButton>
        ) : null}
        <Link
          href="/"
          className={homeClass}
          style={
            showCreate
              ? {
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--bg-border)",
                }
              : undefined
          }
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
