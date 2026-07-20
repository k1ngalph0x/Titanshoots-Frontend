export type DividerVariant = "rule" | "status" | "ticks" | "dashed";

export function Divider({
  variant = "rule",
  label,
}: {
  variant?: DividerVariant;
  label?: string;
}) {
  if (variant === "status") {
    return (
      <div
        className="tech-label flex items-center gap-3 px-6 py-1.5"
        style={{
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface-dim)",
          color: "var(--ink-muted)",
        }}
      >
        <span style={{ color: "var(--accent)" }} className="blink">
          ●
        </span>
        {label ?? "System online · Unit 001 · Bookings open"}
      </div>
    );
  }

  if (variant === "ticks") {
    return (
      <div
        aria-hidden="true"
        className="flex h-3 w-full items-stretch overflow-hidden"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <div
          className="h-full flex-1"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--line-strong) 0 1px, transparent 1px 12px)",
          }}
        />
        <div
          className="h-full w-16 shrink-0"
          style={{ background: "var(--accent)" }}
        />
      </div>
    );
  }

  if (variant === "dashed") {
    return (
      <div
        aria-hidden="true"
        className="w-full"
        style={{
          height: 2,
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--accent) 0 14px, transparent 14px 24px)",
        }}
      />
    );
  }

  // "rule" — default
  return (
    <div
      aria-hidden="true"
      className="h-[2px] w-full"
      style={{ background: "var(--accent)" }}
    />
  );
}
