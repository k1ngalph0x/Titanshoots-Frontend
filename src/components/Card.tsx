import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 6,
      }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className={className}>{children}</div>
    </div>
  );
}
