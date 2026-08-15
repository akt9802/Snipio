import {
  ExtensionIcon,
  QrIcon,
  DownloadIcon,
  LayoutIcon,
  ShieldIcon,
  ClockIcon,
} from "@/components/icons";
import type { SVGProps } from "react";

type FeatureItem = {
  Icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  emoji: string;
  title: string;
  description: string;
  accent?: string;
};

const features: FeatureItem[] = [
  {
    Icon: ExtensionIcon,
    emoji: "🧩",
    title: "Browser extension",
    description:
      "Alt+S during any YouTube or Coursera lecture. Captures the raw video frame — not a screenshot full of browser chrome.",
    accent: "#fde8d8",
  },
  {
    Icon: QrIcon,
    emoji: "📷",
    title: "QR code pairing",
    description:
      "Scan from your laptop screen and your tablet joins the room. No typing, no login, no app store.",
    accent: "#ddeaff",
  },
  {
    Icon: DownloadIcon,
    emoji: "🖼️",
    title: "Auto-save to gallery",
    description:
      "Toggle auto-save and every screenshot drops directly into your Samsung Gallery, ready to pull into notes.",
    accent: "#d8f3e8",
  },
  {
    Icon: LayoutIcon,
    emoji: "📝",
    title: "Split-screen native",
    description:
      "Designed to sit next to Samsung Notes. Drag a slide card from Snipio directly onto your note page.",
    accent: "#f0e4ff",
  },
  {
    Icon: ShieldIcon,
    emoji: "🔒",
    title: "Nothing is stored",
    description:
      "No account. No database. Images live only in your room and disappear when you close it.",
    accent: "#fef3c7",
  },
  {
    Icon: ClockIcon,
    emoji: "🗂️",
    title: "Lecture timeline",
    description:
      "Every slide captured in order — scroll back through the session just like flipping lecture notes.",
    accent: "#fee2e2",
  },
];

function FeatureCard({ emoji, title, description, accent }: FeatureItem) {
  return (
    <div
      className="group rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--bg-border)",
        boxShadow: "var(--shadow-sm)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ background: accent ?? "var(--bg-surface)" }}
      >
        {emoji}
      </div>
      <div>
        <h3
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-20">
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
            Features
          </p>
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Built for how students actually work
        </h2>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Every detail designed around the real lecture → tablet → notes workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}
