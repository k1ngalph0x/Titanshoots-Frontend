import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchAuditLog, type AuditEntry } from "../../api/admin";
import TechFrame from "../../components/TechFrame";

const PAGE = 50;

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  async function load(reset = false) {
    setLoading(true);
    const off = reset ? 0 : offset;
    const rows = await fetchAuditLog(PAGE, off);
    setHasMore(rows.length === PAGE);
    setEntries((prev) => (reset ? rows : [...prev, ...rows]));
    setOffset(off + rows.length);
    setLoading(false);
  }
  useEffect(() => {
    load(true);
  }, []);

  return (
    <div>
      <div className="tech-label mb-2" style={{ color: "var(--accent)" }}>
        ※ Trail
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-8">AUDIT LOG</h1>

      {loading && entries.length === 0 && (
        <div className="tech-label blink" style={{ color: "var(--ink-muted)" }}>
          ◆ Loading…
        </div>
      )}
      {!loading && entries.length === 0 && (
        <TechFrame className="p-8 text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            No admin actions recorded yet.
          </p>
        </TechFrame>
      )}

      <div className="space-y-2">
        {entries.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.02 }}
          >
            <AuditRow entry={e} />
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => load(false)}
          disabled={loading}
          className="mt-4 px-5 py-2.5 clip-corner tech-label"
          style={{ border: "1px solid var(--line)", color: "var(--ink-soft)" }}
        >
          {loading ? "◆ Loading…" : "Load more ↓"}
        </button>
      )}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const d = new Date(entry.created_at);
  const when = d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const verb = entry.action.split(".")[1] ?? entry.action;
  const actionColor =
    verb === "create"
      ? "var(--success)"
      : verb === "delete"
        ? "var(--danger)"
        : "var(--accent)";

  return (
    <TechFrame className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <span
              className="tech-label px-2 py-0.5 clip-corner"
              style={{ background: "var(--accent-wash)", color: actionColor }}
            >
              {entry.action}
            </span>
            <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
              {entry.target_type}
              {entry.target_id != null ? ` #${entry.target_id}` : ""}
            </span>
          </div>
          <div className="space-y-0.5">
            {formatDetails(entry.details).map((line, idx) => (
              <div
                key={idx}
                className="text-sm"
                style={{ color: "var(--ink-soft)" }}
              >
                <span style={{ color: "var(--ink-muted)" }}>
                  {line.label}:{" "}
                </span>
                {line.text}
              </div>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="tech-label" style={{ color: "var(--ink-muted)" }}>
            {when}
          </div>
          <div
            className="tech-label mt-1"
            style={{ color: "var(--ink-muted)" }}
          >
            admin #{entry.admin_user_id}
          </div>
        </div>
      </div>
    </TechFrame>
  );
}

const MONEY_KEYS = ["price_paise", "discount_paise", "amount_paise"];

function fmtVal(key: string, v: any): string {
  if (v === null || v === undefined) return "—";
  if (MONEY_KEYS.includes(key) && typeof v === "number")
    return `₹${(v / 100).toLocaleString("en-IN")}`;
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

function formatDetails(
  details: Record<string, any> | null,
): { label: string; text: string }[] {
  if (!details) return [];
  const out: { label: string; text: string }[] = [];
  for (const [key, val] of Object.entries(details)) {
    const label = key.replace(/_paise$/, "").replace(/_/g, " ");
    if (val && typeof val === "object" && "old" in val && "new" in val) {
      out.push({
        label,
        text: `${fmtVal(key, val.old)} → ${fmtVal(key, val.new)}`,
      });
    } else {
      out.push({ label, text: fmtVal(key, val) });
    }
  }
  return out;
}
