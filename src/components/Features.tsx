import Reveal from "@/components/Reveal";
import {
  ExtensionIcon,
  QrIcon,
  DownloadIcon,
  LayoutIcon,
  ShieldIcon,
  ClockIcon,
} from "@/components/icons";
import type { ReactElement, SVGProps } from "react";

type FeatureItem = {
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  title: string;
  description: string;
  accent: string;
};

const features: FeatureItem[] = [
  {
    Icon: ExtensionIcon,
    title: "Browser extension",
    description:
      "Alt+S during any YouTube or Coursera lecture. Captures the raw video frame — not a screenshot full of browser chrome.",
    accent: "#fde8d8",
  },
  {
    Icon: QrIcon,
    title: "QR code pairing",
    description:
      "Scan from your laptop screen and your tablet joins the room. No typing, no login, no app store.",
    accent: "#ddeaff",
  },
  {
    Icon: DownloadIcon,
    title: "Auto-save to gallery",
    description:
      "Toggle auto-save and every screenshot drops directly into your Samsung Gallery, ready to pull into notes.",
    accent: "#d8f3e8",
  },
  {
    Icon: LayoutIcon,
    title: "Split-screen native",
    description:
      "Designed to sit next to Samsung Notes. Drag a slide card from Snipio directly onto your note page.",
    accent: "#f0e4ff",
  },
  {
    Icon: ShieldIcon,
    title: "Nothing is stored",
    description:
      "No account. No database. Images live only in your room and disappear when you close it.",
    accent: "#fef3c7",
  },
  {
    Icon: ClockIcon,
    title: "Lecture timeline",
    description:
      "Every slide captured in order — scroll back through the session just like flipping lecture notes.",
    accent: "#fee2e2",
  },
];

function FeatureCard({ Icon, title, description, accent }: FeatureItem) {
  return (
    <div className="surface-card rounded-2xl p-6 flex flex-col gap-4 h-full">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: accent, color: "var(--text-primary)" }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3
          className="text-[15px] font-semibold mb-1.5"
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
    <section id="features" className="page-wrap py-20">
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
            Features
          </p>
        </div>
        <h2
          className="text-2xl md:text-[32px] font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Built for how students actually work
        </h2>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Every detail designed around the real lecture → tablet → notes workflow.
        </p>
      </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 70} className="h-full">
            <FeatureCard {...f} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
