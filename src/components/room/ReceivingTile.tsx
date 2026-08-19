type Props = {
  label?: string;
  compact?: boolean;
};

/** Same “receiving…” tile as the landing demo strip. */
export default function ReceivingTile({ label = "receiving…", compact = false }: Props) {
  return (
    <div
      className="demo-slide anim-receive overflow-hidden rounded-xl"
      style={{
        border: "1px solid rgba(232,100,42,0.35)",
        background: "rgba(232,100,42,0.04)",
      }}
      aria-hidden
    >
      <div
        className={`anim-receive-fill flex flex-col items-center justify-center gap-2 ${compact ? "h-20" : "h-28"}`}
      >
        <span className="w-2.5 h-2.5 rounded-full dot-pulse" style={{ background: "var(--accent)" }} />
        <span className="text-[10px] font-medium code-font" style={{ color: "var(--accent)" }}>
          {label}
        </span>
      </div>
      <div className="px-3 py-2.5" style={{ borderTop: "1px solid rgba(232,100,42,0.2)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
          Incoming slide
        </p>
        <p className="text-[10px] mt-0.5 code-font" style={{ color: "var(--text-muted)" }}>
          just now
        </p>
      </div>
    </div>
  );
}
