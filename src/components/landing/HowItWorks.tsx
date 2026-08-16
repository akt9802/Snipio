import { MonitorIcon, TabletIcon, CameraIcon } from "@/components/layout/icons";
import Reveal from "@/components/layout/Reveal";

const steps = [
  {
    icon: MonitorIcon,
    step: "01",
    title: "Open Snipio on your laptop",
    description:
      "Create a room — you get a short code like DBMS-4821 and a QR code. Takes about 2 seconds.",
  },
  {
    icon: TabletIcon,
    step: "02",
    title: "Scan the QR on your tablet",
    description:
      "Point your tablet camera at the QR. It opens instantly in Samsung Internet or Chrome. No app to install.",
  },
  {
    icon: CameraIcon,
    step: "03",
    title: "Press Alt+S during lecture",
    description:
      "The extension grabs the exact video frame and sends it to your tablet. It arrives before you look down.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="page-wrap py-20">
      <Reveal>
      <div className="mb-12 max-w-2xl">
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
          className="text-2xl md:text-[32px] font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Set up once. Forget about it.
        </h2>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Three steps from zero to synced — and only the first one is on your laptop.
        </p>
      </div>
      </Reveal>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="hidden md:block absolute top-[46px] left-[18%] right-[18%] h-px pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(90deg, var(--bg-border) 0 8px, transparent 8px 16px)",
          }}
          aria-hidden
        />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <Reveal key={i} delay={i * 90} className="h-full">
            <div
              className="surface-card relative rounded-2xl p-6 flex flex-col gap-5 h-full"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: "var(--accent-soft)",
                    border: "1px solid rgba(232,100,42,0.16)",
                    color: "var(--accent)",
                  }}
                >
                  <Icon className="w-5 h-5" />
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
                  className="text-[15px] font-semibold mb-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step.description}
                </p>
              </div>
            </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
