import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAuditLog, type AuditEntry } from "../../api/admin";
import Card from "../../components/Card";

const PAGE = 50;

const LABEL: React.CSSProperties = { color: "var(--ink-muted)", fontSize: 12 };
const NUM: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

const COLS = "lg:grid-cols-[76px_minmax(0,220px)_minmax(0,1fr)_92px]";

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dayHeading(d: Date) {
  const diff = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / 86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== new Date().getFullYear()
      ? { year: "numeric" }
      : {}),
  });
}

/* ── Value formatting ──────────────────────────────────────── */

function fmtVal(key: string, v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") {
    if (/_paise$/.test(key)) return `₹${(v / 100).toLocaleString("en-IN")}`;
    if (/_rupees$/.test(key)) return `₹${v.toLocaleString("en-IN")}`;
    if (/(_percent|_pct)$/.test(key)) return `${v}%`;
    return v.toLocaleString("en-IN");
  }
  if (typeof v === "string" && /_at$/.test(key)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function cleanLabel(key: string) {
  return key
    .replace(/_(paise|rupees)$/, "")
    .replace(/_percent$/, " %")
    .replace(/_/g, " ");
}

type Line = { label: string; old?: string; next: string; isDiff: boolean };

function formatDetails(details: Record<string, any> | null): Line[] {
  if (!details) return [];
  return Object.entries(details).map(([key, val]) => {
    const label = cleanLabel(key);
    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      "old" in val &&
      "new" in val
    ) {
      return {
        label,
        old: fmtVal(key, (val as any).old),
        next: fmtVal(key, (val as any).new),
        isDiff: true,
      };
    }
    return { label, next: fmtVal(key, val), isDiff: false };
  });
}

/* ── Action badge ──────────────────────────────────────────── */

function verbOf(action: string) {
  const parts = action.split(".");
  return (parts[1] ?? parts[0] ?? "").toLowerCase();
}

function badgeStyle(verb: string) {
  if (/^(create|add)/.test(verb))
    return { fg: "var(--success)", bg: "rgba(18,133,90,0.09)" };
  if (/^(delete|remove|cancel)/.test(verb))
    return { fg: "var(--danger)", bg: "rgba(240,22,74,0.09)" };
  return { fg: "var(--ink-soft)", bg: "var(--surface-dim)" };
}

function ActionBadge({ action }: { action: string }) {
  const s = badgeStyle(verbOf(action));
  return (
    <span
      className="inline-flex items-center px-2 py-[3px] text-xs font-medium"
      style={{ ...NUM, color: s.fg, background: s.bg, borderRadius: 4 }}
    >
      {action}
    </span>
  );
}

/* ── Row ───────────────────────────────────────────────────── */

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [raw, setRaw] = useState(false);
  const d = new Date(entry.created_at);
  const lines = useMemo(() => formatDetails(entry.details), [entry.details]);

  return (
    <div
      className={`grid grid-cols-1 gap-2 px-4 py-3 lg:gap-4 ${COLS}`}
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div style={{ ...LABEL, ...NUM }}>
        {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </div>

      <div className="min-w-0">
        <ActionBadge action={entry.action} />
        <div className="mt-1.5 truncate" style={LABEL}>
          {entry.target_type}
          {entry.target_id != null && (
            <span style={NUM}> #{entry.target_id}</span>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {lines.length === 0 ? (
          <span style={LABEL}>No details recorded</span>
        ) : (
          <div className="space-y-1">
            {lines.map((l, i) => (
              <div key={i} className="text-sm">
                <span style={LABEL}>{l.label} </span>
                {l.isDiff ? (
                  <>
                    <span
                      style={{
                        ...NUM,
                        color: "var(--ink-muted)",
                        textDecoration: "line-through",
                      }}
                    >
                      {l.old}
                    </span>
                    <span style={{ color: "var(--ink-muted)" }}> → </span>
                    <span className="font-medium" style={NUM}>
                      {l.next}
                    </span>
                  </>
                ) : (
                  <span style={NUM}>{l.next}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {entry.details && (
          <>
            <button
              type="button"
              onClick={() => setRaw((v) => !v)}
              className="mt-1.5"
              style={{ ...LABEL, color: "var(--ink-muted)" }}
            >
              {raw ? "Hide raw" : "Show raw"}
            </button>
            {raw && (
              <pre
                className="mt-1.5 overflow-x-auto p-2.5 text-xs"
                style={{
                  ...NUM,
                  background: "var(--surface-dim)",
                  borderRadius: 4,
                  color: "var(--ink-soft)",
                }}
              >
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>

      <div className="lg:text-right" style={{ ...LABEL, ...NUM }}>
        admin #{entry.admin_user_id}
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [verb, setVerb] = useState("");

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (off: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setErr(null);
    try {
      const rows = await fetchAuditLog(PAGE, off);
      if (!mounted.current) return;
      setHasMore(rows.length === PAGE);
      setEntries((prev) => (append ? [...prev, ...rows] : rows));
      setOffset(off + rows.length);
    } catch {
      if (mounted.current) setErr("Couldn't load the audit log.");
    } finally {
      if (mounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    load(0, false);
  }, [load]);

  /* Verb chips derived from what's actually loaded. */
  const verbs = useMemo(() => {
    const seen = new Map<string, number>();
    for (const e of entries) {
      const v = verbOf(e.action);
      seen.set(v, (seen.get(v) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (verb && verbOf(e.action) !== verb) return false;
      if (!needle) return true;
      const hay = `${e.action} ${e.target_type} ${e.target_id ?? ""} ${
        e.details ? JSON.stringify(e.details) : ""
      } ${e.admin_user_id}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [entries, q, verb]);

  /* Group by calendar day, preserving server order. */
  const groups = useMemo(() => {
    const out: { key: number; heading: string; rows: AuditEntry[] }[] = [];
    for (const e of filtered) {
      const key = startOfDay(new Date(e.created_at)).getTime();
      const last = out[out.length - 1];
      if (last && last.key === key) last.rows.push(e);
      else
        out.push({
          key,
          heading: dayHeading(new Date(e.created_at)),
          rows: [e],
        });
    }
    return out;
  }, [filtered]);

  const active = !!(q.trim() || verb);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <div className="mt-1" style={{ ...LABEL, fontSize: 13 }}>
          {loading && entries.length === 0
            ? "Loading…"
            : active
              ? `${filtered.length} of ${entries.length} loaded ${entries.length === 1 ? "entry" : "entries"}`
              : `${entries.length}${hasMore ? "+" : ""} ${entries.length === 1 ? "entry" : "entries"} · newest first`}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { k: "", n: entries.length, label: "All" },
            ...verbs.map(([v, n]) => ({ k: v, n, label: v })),
          ].map((f) => {
            const on = verb === f.k;
            return (
              <button
                key={f.k || "all"}
                onClick={() => setVerb(f.k)}
                className="text-sm capitalize transition-colors"
                style={{
                  padding: "6px 13px",
                  borderRadius: 5,
                  border: `1px solid ${on ? "var(--ink)" : "var(--line)"}`,
                  background: on ? "var(--ink)" : "var(--surface)",
                  color: on ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {f.label}
                <span className="ml-1.5" style={{ opacity: 0.6 }}>
                  {f.n}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQ("");
            }}
            placeholder="Search action, target or value"
            className="text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 5,
              color: "var(--ink)",
              padding: "8px 12px",
              width: 280,
            }}
          />
          {active && (
            <button
              onClick={() => {
                setQ("");
                setVerb("");
              }}
              className="text-sm"
              style={{ color: "var(--ink-muted)", padding: "8px 4px" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {active && hasMore && (
        <p className="mb-3" style={{ ...LABEL, fontSize: 13 }}>
          Filtering only the entries loaded so far — load more to search further
          back.
        </p>
      )}

      {err && (
        <div
          className="mb-4 flex items-center justify-between gap-4 px-4 py-3"
          style={{
            background: "var(--surface)",
            borderRadius: 4,
            border: "1px solid var(--line)",
            borderLeft: "3px solid var(--danger)",
          }}
        >
          <span className="text-sm">{err}</span>
          <button
            onClick={() => load(0, false)}
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Log */}
      {loading && entries.length === 0 ? (
        <Card>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-4"
              style={i ? { borderTop: "1px solid var(--line)" } : undefined}
            >
              <span
                className="block animate-pulse"
                style={{
                  height: 14,
                  width: `${40 + (i % 3) * 18}%`,
                  borderRadius: 3,
                  background: "var(--surface-dim)",
                }}
              />
            </div>
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <div className="font-medium">
            {active
              ? "Nothing matches those filters"
              : "No admin actions recorded yet"}
          </div>
          <p
            className="mx-auto mt-1.5 max-w-sm"
            style={{ ...LABEL, fontSize: 13 }}
          >
            {active
              ? "Try a different action type, or clear the search."
              : "Pricing edits, booking changes and cancellations will show up here."}
          </p>
          {active && (
            <button
              onClick={() => {
                setQ("");
                setVerb("");
              }}
              className="mt-4 text-sm"
              style={{
                border: "1px solid var(--line)",
                borderRadius: 5,
                padding: "7px 14px",
                color: "var(--ink-soft)",
              }}
            >
              Clear filters
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key}>
              <div
                className="mb-2 px-1 font-medium"
                style={{ ...LABEL, fontSize: 13 }}
              >
                {g.heading}
              </div>
              <Card>
                <div
                  className={`hidden px-4 py-2.5 lg:grid lg:gap-4 ${COLS}`}
                  style={{ ...LABEL, background: "var(--surface-dim)" }}
                >
                  <div>Time</div>
                  <div>Action</div>
                  <div>Changes</div>
                  <div className="text-right">By</div>
                </div>
                {g.rows.map((e) => (
                  <AuditRow key={e.id} entry={e} />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={() => load(offset, true)}
            disabled={loadingMore}
            className="text-sm"
            style={{
              border: "1px solid var(--line)",
              borderRadius: 5,
              padding: "9px 20px",
              background: "var(--surface)",
              color: loadingMore ? "var(--ink-muted)" : "var(--ink-soft)",
              cursor: loadingMore ? "wait" : "pointer",
            }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
