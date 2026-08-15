import { BoltIcon } from "@/components/icons";

export default function Navbar() {
  return (
    <>
      <style>{`
        .nav-link {
          color: var(--text-secondary);
          background: transparent;
          transition: color 0.15s ease, background 0.15s ease;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-surface);
        }
        .nav-cta {
          color: var(--text-primary);
          border-color: var(--bg-border);
          background: var(--bg-elevated);
          box-shadow: var(--shadow-sm);
          transition: background 0.15s ease, box-shadow 0.15s ease;
        }
        .nav-cta:hover {
          background: var(--bg-surface);
        }
      `}</style>
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: "rgba(250,249,247,0.90)",
          borderBottom: "1px solid var(--bg-border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-[58px] flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <BoltIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Snipio
            </span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <a href="#how-it-works" className="nav-link px-3.5 py-1.5 text-sm rounded-lg">
              How it works
            </a>
            <a href="#features" className="nav-link px-3.5 py-1.5 text-sm rounded-lg">
              Features
            </a>
          </nav>

          {/* CTA */}
          <a
            href="#"
            className="nav-cta hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border"
          >
            <span className="w-2 h-2 rounded-full dot-pulse" style={{ background: "var(--success)" }} />
            Get extension
          </a>
        </div>
      </header>
    </>
  );
}
