import type { ReactNode } from "react";

export default function TechFrame({
  children,
  active = false,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className="clip-corner p-px transition-colors duration-150"
      style={{ background: active ? "var(--accent)" : "var(--line-strong)" }}
    >
      <div
        className={`clip-corner ${className}`}
        style={{ background: "var(--surface)" }}
      >
        {children}
      </div>
    </div>
  );
}
