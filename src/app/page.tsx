import Navbar from "@/components/layout/Navbar";
import RoomCard from "@/components/landing/RoomCard";
import HowItWorks from "@/components/landing/HowItWorks";
import BeforeAfter from "@/components/landing/BeforeAfter";
import Features from "@/components/landing/Features";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/layout/Reveal";
import CreateRoomButton from "@/components/landing/CreateRoomButton";

const slides = [
  {
    name: "ER Diagram",
    code: "slide_01.png",
    time: "10:42",
    bg: "#fde8d8",
    preview: "er",
  },
  {
    name: "Normal Forms",
    code: "slide_02.png",
    time: "10:51",
    bg: "#ddeaff",
    preview: "table",
  },
  {
    name: "SQL Joins",
    code: "slide_03.png",
    time: "11:03",
    bg: "#d8f3e8",
    preview: "joins",
  },
  {
    name: "Indexing",
    code: "slide_04.png",
    time: "11:17",
    bg: "#f0e4ff",
    preview: "tree",
  },
] as const;

function SlidePreview({ kind }: { kind: (typeof slides)[number]["preview"] }) {
  const stroke = "rgba(26,23,20,0.28)";
  const fill = "rgba(255,255,255,0.7)";

  if (kind === "er") {
    return (
      <svg viewBox="0 0 72 40" className="w-16 h-9" aria-hidden>
        <rect x="4" y="4" width="22" height="12" rx="2" fill={fill} stroke={stroke} />
        <rect x="46" y="4" width="22" height="12" rx="2" fill={fill} stroke={stroke} />
        <rect x="25" y="24" width="22" height="12" rx="2" fill={fill} stroke={stroke} />
        <path d="M26 10h20M15 16v8h10M57 16v8H47" fill="none" stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }

  if (kind === "table") {
    return (
      <svg viewBox="0 0 72 40" className="w-16 h-9" aria-hidden>
        <rect x="8" y="6" width="56" height="28" rx="3" fill={fill} stroke={stroke} />
        <path d="M8 14h56M8 22h56M8 30h56M26 6v28M46 6v28" fill="none" stroke={stroke} strokeWidth="1.1" />
      </svg>
    );
  }

  if (kind === "joins") {
    return (
      <svg viewBox="0 0 72 40" className="w-16 h-9" aria-hidden>
        <circle cx="28" cy="20" r="12" fill={fill} stroke={stroke} />
        <circle cx="44" cy="20" r="12" fill="rgba(255,255,255,0.35)" stroke={stroke} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 72 40" className="w-16 h-9" aria-hidden>
      <circle cx="36" cy="8" r="4" fill={fill} stroke={stroke} />
      <circle cx="20" cy="24" r="4" fill={fill} stroke={stroke} />
      <circle cx="36" cy="24" r="4" fill={fill} stroke={stroke} />
      <circle cx="52" cy="24" r="4" fill={fill} stroke={stroke} />
      <path d="M36 12v8M36 24l-16 0M36 24h16" fill="none" stroke={stroke} strokeWidth="1.2" />
      <circle cx="12" cy="34" r="2.5" fill={fill} stroke={stroke} />
      <circle cx="28" cy="34" r="2.5" fill={fill} stroke={stroke} />
      <path d="M20 28v4h-8M20 28v4h8" fill="none" stroke={stroke} strokeWidth="1.1" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen grain relative" style={{ background: "var(--bg-base)" }}>
      <Navbar />

      <main className="flex-1">
        <section className="hero-glow">
          <div className="page-wrap pt-16 pb-12 md:pt-20 md:pb-14">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 xl:gap-16 items-center">
              <div>
                <div className="anim-fade-in inline-flex items-center gap-2 mb-6">
                  <span
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
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
                  className="anim-fade-up delay-1 text-[40px] sm:text-5xl xl:text-[56px] font-extrabold tracking-tight leading-[1.08] mb-5"
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
                  className="anim-fade-up delay-2 text-[17px] leading-[1.7] mb-8 max-w-lg"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No WhatsApp. No cables. No manual uploading. Press{" "}
                  <kbd>Alt</kbd>+<kbd>S</kbd> during your lecture and the slide
                  is already waiting on your tablet.
                </p>

                <div className="anim-fade-up delay-3 flex flex-wrap items-center gap-2.5">
                  {[
                    { label: "No account needed" },
                    { label: "Zero install on tablet" },
                    { label: "Under 100ms" },
                  ].map(({ label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full"
                      style={{
                        color: "var(--text-secondary)",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--bg-border)",
                      }}
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

              <div className="anim-fade-up delay-2 flex justify-center lg:justify-end">
                <div className="anim-float w-full max-w-md">
                  <RoomCard />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-wrap pb-6">
          <div
            className="anim-fade-up delay-4 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid var(--bg-border)",
              background: "var(--bg-elevated)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div
              className="flex items-center gap-1.5 px-4 py-3"
              style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: "#fc5757" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#fdbc40" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#33c748" }} />
              <div className="ml-4 flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full dot-pulse flex-shrink-0"
                  style={{ background: "var(--success)" }}
                />
                <span
                  className="text-xs truncate code-font"
                  style={{ color: "var(--text-muted)" }}
                >
                  Room: DBMS-4821 — 2 devices connected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
              {slides.map((slide) => (
                <div
                  key={slide.code}
                  className="demo-slide rounded-xl overflow-hidden"
                  style={{
                    border: "1px solid var(--bg-border)",
                    background: "var(--bg-surface)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    className="h-24 flex flex-col items-center justify-center gap-1.5"
                    style={{ background: slide.bg }}
                  >
                    <SlidePreview kind={slide.preview} />
                    <span
                      className="text-[10px] code-font"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {slide.code}
                    </span>
                  </div>
                  <div className="px-3 py-2.5" style={{ borderTop: "1px solid var(--bg-border)" }}>
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {slide.name}
                    </p>
                    <p
                      className="text-[10px] mt-0.5 code-font"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {slide.time}
                    </p>
                  </div>
                </div>
              ))}

              <div
                className="demo-slide anim-receive rounded-xl overflow-hidden"
                style={{
                  border: "1px solid rgba(232,100,42,0.35)",
                  background: "rgba(232,100,42,0.04)",
                }}
              >
                <div
                  className="anim-receive-fill h-24 flex flex-col items-center justify-center gap-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full dot-pulse"
                    style={{ background: "var(--accent)" }}
                  />
                  <span
                    className="text-[10px] font-medium code-font"
                    style={{ color: "var(--accent)" }}
                  >
                    receiving…
                  </span>
                </div>
                <div className="px-3 py-2.5" style={{ borderTop: "1px solid rgba(232,100,42,0.2)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    Transactions
                  </p>
                  <p
                    className="text-[10px] mt-0.5 code-font"
                    style={{ color: "var(--text-muted)" }}
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

        <section className="page-wrap pt-8 pb-24">
          <Reveal>
          <div
            className="rounded-2xl px-8 py-12 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #fff7f3 0%, #fff1ea 50%, #fde8d8 100%)",
              border: "1px solid rgba(232,100,42,0.2)",
            }}
          >
            <div
              className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-20 pointer-events-none"
              style={{ background: "var(--accent)" }}
            />
            <div
              className="absolute right-24 -bottom-16 w-36 h-36 rounded-full opacity-10 pointer-events-none"
              style={{ background: "var(--accent)" }}
            />
            <div className="relative">
              <h2
                className="text-xl md:text-2xl font-bold tracking-tight mb-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                Ready to stop using WhatsApp for this?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Create a room. Scan with tablet. Start lecture.
              </p>
            </div>
            <CreateRoomButton
              id="cta-create-room-btn"
              className="btn-primary relative flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer"
            >
              Create a room
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cta-arrow w-4 h-4"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </CreateRoomButton>
          </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
