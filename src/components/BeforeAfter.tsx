import Reveal from "@/components/Reveal";

const before = [
  "Take screenshot",
  "Open WhatsApp Web",
  "Send to yourself",
  "Unlock tablet",
  "Open WhatsApp",
  "Find and download",
  "Open Samsung Notes",
  "Insert image",
];

const after = [
  { text: "Take screenshot (or press Alt+S)", highlight: false },
  { text: "It's already on your tablet", highlight: true },
  { text: "Drag into Samsung Notes", highlight: false },
];

export default function BeforeAfter() {
  return (
    <section className="page-wrap py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Reveal className="h-full">
        <div
          className="rounded-2xl p-6 md:p-7 h-full"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>😮‍💨</span>
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Without Snipio
              </span>
            </div>
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-surface)",
                border: "1px solid var(--bg-border)",
              }}
            >
              8 steps
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {before.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center flex-shrink-0"
                  style={{
                    border: "1px solid var(--bg-border)",
                    color: "var(--text-muted)",
                    background: i === 0 ? "var(--bg-surface)" : "transparent",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: i === 0 ? "var(--text-primary)" : "var(--text-muted)",
                    textDecoration: i > 0 && i < 7 ? "line-through" : undefined,
                    opacity: i > 0 ? 0.55 : 1,
                  }}
                >
                  {step}
                </span>
              </li>
            ))}
          </ul>
          <p
            className="mt-5 text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            8 steps. Every. Single. Time.
          </p>
        </div>
        </Reveal>

        <Reveal delay={100} className="h-full">
        <div
          className="rounded-2xl p-6 md:p-7 h-full"
          style={{
            background: "linear-gradient(145deg, #fff9f6 0%, #fff4ee 100%)",
            border: "1px solid rgba(232,100,42,0.22)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>⚡</span>
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                With Snipio
              </span>
            </div>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: "var(--accent)",
                background: "rgba(232,100,42,0.10)",
                border: "1px solid rgba(232,100,42,0.20)",
              }}
            >
              3 steps
            </span>
          </div>
          <ul className="flex flex-col gap-5">
            {after.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-px"
                  style={
                    step.highlight
                      ? {
                          background: "rgba(232,100,42,0.15)",
                          border: "1px solid rgba(232,100,42,0.30)",
                          color: "var(--accent)",
                        }
                      : {
                          border: "1px solid var(--bg-border)",
                          color: "var(--text-muted)",
                        }
                  }
                >
                  {i + 1}
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{
                    color: step.highlight ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: step.highlight ? 600 : 400,
                  }}
                >
                  {step.text}
                  {step.highlight && (
                    <span
                      className="ml-2 inline-flex items-center text-[10px] font-semibold rounded-md px-1.5 py-0.5"
                      style={{
                        color: "var(--accent)",
                        background: "rgba(232,100,42,0.10)",
                        border: "1px solid rgba(232,100,42,0.20)",
                        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                      }}
                    >
                      &lt;100ms
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p
            className="mt-8 text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            After the first setup, it&apos;s just one keystroke.
          </p>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
