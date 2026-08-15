import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import HowItWorks from "@/components/HowItWorks";
import BeforeAfter from "@/components/BeforeAfter";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

const slideColors = [
  "#fde8d8", // warm peach
  "#ddeaff", // soft blue
  "#d8f3e8", // mint green
  "#f0e4ff", // lavender
];

const slideLabels = [
  { icon: "📊", name: "ER Diagram", code: "slide_01.png", time: "10:42" },
  { icon: "📋", name: "Normal Forms", code: "slide_02.png", time: "10:51" },
  { icon: "🔗", name: "SQL Joins", code: "slide_03.png", time: "11:03" },
  { icon: "⚡", name: "Indexing", code: "slide_04.png", time: "11:17" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left: Copy */}
            <div>
              {/* Tag */}
              <div className="anim-fade-in inline-flex items-center gap-2 mb-6">
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    border: "1px solid rgba(232,100,42,0.18)",
                  }}
                >
                  For students with a laptop + tablet
                </span>
              </div>

              <h1
                className="anim-fade-up delay-1 text-[42px] md:text-5xl font-extrabold tracking-tight leading-[1.08] mb-5"
                style={{ color: "var(--text-primary)" }}
              >
                Screenshot on laptop.{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, #f5a06a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  On your tablet instantly.
                </span>
              </h1>

              <p
                className="anim-fade-up delay-2 text-[17px] leading-[1.7] mb-8 max-w-md"
                style={{ color: "var(--text-secondary)" }}
              >
                No WhatsApp. No cables. No manual uploading. Press{" "}
                <kbd>Alt</kbd>+<kbd>S</kbd> during your lecture and the slide
                is already waiting on your tablet.
              </p>

              <div className="anim-fade-up delay-3 flex flex-wrap items-center gap-5">
                {[
                  { label: "No account needed" },
                  { label: "Zero install on tablet" },
                  { label: "Under 100ms" },
                ].map(({ label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--success)" }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Room card */}
            <div className="anim-fade-up delay-2 flex justify-center lg:justify-end">
              <RoomCard />
            </div>
          </div>
        </section>

        {/* ── Demo mockup strip ──────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pb-6">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid var(--bg-border)",
              background: "var(--bg-elevated)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Mock window chrome */}
            <div
              className="flex items-center gap-1.5 px-4 py-3"
              style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: "#fc5757" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#fdbc40" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#33c748" }} />
              <div className="ml-4 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full dot-pulse"
                  style={{ background: "var(--success)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Room: DBMS-4821 — 2 devices connected
                </span>
              </div>
            </div>

            {/* Slide thumbnails row */}
            <div className="flex gap-3 p-4 overflow-x-auto">
              {slideLabels.map((slide, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-36 rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                  style={{
                    border: "1px solid var(--bg-border)",
                    background: "var(--bg-surface)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    className="h-20 flex flex-col items-center justify-center gap-1"
                    style={{ background: slideColors[i] }}
                  >
                    <span className="text-2xl">{slide.icon}</span>
                    <span
                      className="text-[10px]"
                      style={{
                        color: "var(--text-muted)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {slide.code}
                    </span>
                  </div>
                  <div className="px-2.5 py-2" style={{ borderTop: "1px solid var(--bg-border)" }}>
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {slide.name}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {slide.time}
                    </p>
                  </div>
                </div>
              ))}

              {/* Latest incoming */}
              <div
                className="flex-shrink-0 w-36 rounded-xl overflow-hidden"
                style={{
                  border: "1px solid rgba(232,100,42,0.35)",
                  background: "rgba(232,100,42,0.04)",
                }}
              >
                <div
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  style={{ background: "rgba(232,100,42,0.08)" }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full dot-pulse"
                    style={{ background: "var(--accent)" }}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{
                      color: "var(--accent)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    receiving…
                  </span>
                </div>
                <div className="px-2.5 py-2" style={{ borderTop: "1px solid rgba(232,100,42,0.2)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    Transactions
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    just now
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BeforeAfter />
        <HowItWorks />
        <Features />

        {/* ── CTA ────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pt-8 pb-24">
          <div
            className="rounded-2xl px-8 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #fff7f3 0%, #fff1ea 50%, #fde8d8 100%)",
              border: "1px solid rgba(232,100,42,0.2)",
            }}
          >
            {/* decorative circle */}
            <div
              className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-20 pointer-events-none"
              style={{ background: "var(--accent)" }}
            />
            <div className="relative">
              <h2
                className="text-xl font-bold tracking-tight mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Ready to stop using WhatsApp for this?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Create a room. Scan with tablet. Start lecture.
              </p>
            </div>
            <button
              id="cta-create-room-btn"
              className="relative flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] hover:opacity-90"
              style={{
                background: "var(--accent)",
                boxShadow: "0 4px 16px rgba(232,100,42,0.35)",
              }}
            >
              Create a room
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
