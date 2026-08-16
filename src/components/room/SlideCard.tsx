export type SlideCardProps = {
  id: string;
  name: string;
  time: string;
};

export default function SlideCard({ name, time }: SlideCardProps) {
  return (
    <article
      className="overflow-hidden rounded-xl"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--bg-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="h-36 flex items-center justify-center" style={{ background: "#fde8d8" }}>
        <span className="text-xs code-font" style={{ color: "var(--text-muted)" }}>
          slide.png
        </span>
      </div>
      <div className="px-3 py-2.5" style={{ borderTop: "1px solid var(--bg-border)" }}>
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {name}
        </p>
        <p className="text-[11px] mt-0.5 code-font" style={{ color: "var(--text-muted)" }}>
          {time}
        </p>
      </div>
    </article>
  );
}
