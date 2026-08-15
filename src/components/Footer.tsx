import { BoltIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--bg-border)" }}>
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <BoltIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Snipio
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            — built for students who actually study.
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>No data stored</span>
          <span style={{ color: "var(--bg-border)" }}>·</span>
          <span>No account required</span>
          <span style={{ color: "var(--bg-border)" }}>·</span>
          <a
            href="https://github.com/akt9802/Snipio"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Open source ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
