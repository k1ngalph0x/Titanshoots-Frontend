import type { CSSProperties, ReactNode } from "react";

export default function TechFrame({
  children,
  active = false,
  className = "",
  cut,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
  cut?: number;
}) {
  const outer: CSSProperties = {
    background: active ? "var(--accent)" : "var(--line-strong)",
    ...(cut !== undefined ? ({ "--cut": `${cut}px` } as CSSProperties) : {}),
  };
  return (
    <div
      className="clip-corner p-px transition-colors duration-150"
      style={outer}
    >
      <div
        className={`clip-corner ${className}`}
        style={{ background: "var(--surface)", overflow: "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}
