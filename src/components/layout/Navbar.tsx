import { BoltIcon } from "@/components/layout/icons";

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
          transition: background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .nav-cta:hover {
          background: var(--bg-surface);
          border-color: rgba(232,100,42,0.28);
          box-shadow: var(--shadow-md);
        }
      `}</style>
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: "rgba(250,249,247,0.88)",
          borderBottom: "1px solid var(--bg-border)",
        }}
      >
        <div className="page-wrap h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "var(--accent)", boxShadow: "0 4px 10px rgba(232,100,42,0.28)" }}
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

          <nav className="hidden md:flex items-center gap-0.5">
            <a href="#how-it-works" className="nav-link px-3.5 py-1.5 text-sm rounded-lg">
              How it works
            </a>
            <a href="#features" className="nav-link px-3.5 py-1.5 text-sm rounded-lg">
              Features
            </a>
          </nav>

          <a
            href="#"
            className="nav-cta flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border"
          >
            <span className="w-2 h-2 rounded-full dot-pulse" style={{ background: "var(--success)" }} />
            Get extension
          </a>
        </div>
      </header>
    </>
  );
}
