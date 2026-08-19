type Tone = "wait" | "ok" | "error";

type Props = {
  title: string;
  detail?: string;
  tone: Tone;
  pulse?: boolean;
  size?: "desk" | "pill";
};

function toneWord(tone: Tone) {
  if (tone === "ok") return "Connected";
  if (tone === "error") return "Alert";
  return "Waiting";
}

export default function StatusBadge({ title, detail, tone, pulse = false, size = "pill" }: Props) {
  const color =
    tone === "ok" ? "var(--success)" : tone === "error" ? "var(--error)" : "var(--accent)";
  const word = toneWord(tone);

  if (size === "pill") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 min-h-11 rounded-full"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          color: "var(--text-secondary)",
        }}
        aria-live="polite"
      >
        <span
          className={pulse ? "dot-pulse" : ""}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: color,
            display: "inline-block",
            flexShrink: 0,
          }}
          aria-hidden
        />
        <span className="sr-only">{word}. </span>
        {title}
      </span>
    );
  }

  return (
    <div className="flex items-start gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--bg-border)" }}>
      <span
        className={pulse ? "dot-pulse" : ""}
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: color,
          flexShrink: 0,
          marginTop: 6,
        }}
        aria-hidden
      />
      <div className="min-w-0" aria-live="polite">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color }}
        >
          {word}
        </p>
        <p className="text-xl font-bold tracking-tight leading-tight mt-0.5" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        {detail ? (
          <p className="text-sm mt-1 leading-snug" style={{ color: "var(--text-secondary)" }}>
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
