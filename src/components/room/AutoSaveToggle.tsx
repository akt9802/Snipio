"use client";

import { useState } from "react";

export default function AutoSaveToggle() {
  const [on, setOn] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Auto-save incoming slides"
      onClick={() => setOn((value) => !value)}
      className="inline-flex items-center gap-2.5 min-h-11 px-3 rounded-xl cursor-pointer"
      style={{
        background: on ? "var(--success-soft)" : "var(--bg-surface)",
        border: on ? "1px solid rgba(39, 160, 90, 0.35)" : "1px solid var(--bg-border)",
        color: on ? "var(--success)" : "var(--text-secondary)",
      }}
    >
      <span
        aria-hidden
        className="relative flex-shrink-0"
        style={{
          width: 36,
          height: 22,
          borderRadius: 999,
          background: on ? "var(--success)" : "var(--bg-overlay)",
          transition: "background 0.15s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 16 : 3,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "#fff",
            boxShadow: "var(--shadow-sm)",
            transition: "left 0.15s ease",
          }}
        />
      </span>
      <span className="text-sm font-medium">Auto-save</span>
    </button>
  );
}
