export type SlideCardProps = {
  id: string;
  name: string;
  time: string;
  src: string;
};

export default function SlideCard({ name, time, src }: SlideCardProps) {
  return (
    <article
      className="overflow-hidden rounded-xl"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--bg-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="bg-[var(--bg-surface)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} className="block w-full h-auto max-h-[70vh] object-contain mx-auto" />
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
