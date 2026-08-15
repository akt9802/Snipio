import { MonitorIcon, TabletIcon, CameraIcon } from "@/components/icons";

const steps = [
  {
    icon: MonitorIcon,
    emoji: "💻",
    step: "01",
    title: "Open Snipio on your laptop",
    description:
      "Create a room — you get a short code like DBMS-4821 and a QR code. Takes about 2 seconds.",
  },
  {
    icon: TabletIcon,
    emoji: "📱",
    step: "02",
    title: "Scan the QR on your tablet",
    description:
      "Point your tablet camera at the QR. It opens instantly in Samsung Internet or Chrome. No app to install.",
  },
  {
    icon: CameraIcon,
    emoji: "📸",
    step: "03",
    title: "Press Alt+S during lecture",
    description:
      "The extension grabs the exact video frame and sends it to your tablet. It arrives before you look down.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            How it works
          </p>
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Set up once. Forget about it.
        </h2>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Three steps from zero to synced — and only the first one is on your laptop.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="group rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Number badge + icon */}
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:scale-110"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--bg-border)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <span className="text-xl">{step.emoji}</span>
                </div>
                <span
                  className="text-2xl font-black"
                  style={{
                    color: "var(--bg-border)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {step.step}
                </span>
              </div>

              <div>
                <h3
                  className="text-sm font-semibold mb-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
