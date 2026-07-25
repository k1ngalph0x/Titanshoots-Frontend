import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBookings,
  verifyBooking,
  cancelBooking,
  type BookingItem,
} from "../../api/admin";
import Card from "../../components/Card";
import CashBookingModal from "../../components/CashBookingModal";
import EditBookingModal from "./EditBookingModal";

const PAGE = 50;

const FILTERS = [
  { key: "", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "expired", label: "Expired" },
  { key: "cancelled", label: "Cancelled" },
];

const money = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const LABEL: React.CSSProperties = { color: "var(--ink-muted)", fontSize: 12 };
const NUM: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

const COLS =
  "lg:grid-cols-[minmax(0,1.7fr)_144px_minmax(0,1.15fr)_132px_168px_40px]";

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round(
    (startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
  const rel =
    days === 0
      ? "Today"
      : days === 1
        ? "Tomorrow"
        : days === -1
          ? "Yesterday"
          : date;
  return {
    rel,
    time,
    isToday: days === 0,
    isPast: d.getTime() < now.getTime(),
  };
}

const STATE_STYLE: Record<string, { fg: string; bg: string }> = {
  confirmed: { fg: "var(--success)", bg: "rgba(18,133,90,0.09)" },
  pending: { fg: "var(--warning)", bg: "rgba(180,83,9,0.10)" },
  cancelled: { fg: "var(--danger)", bg: "rgba(240,22,74,0.09)" },
};

function StatusBadge({ state }: { state: string }) {
  const s = STATE_STYLE[state] ?? {
    fg: "var(--ink-muted)",
    bg: "var(--surface-dim)",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-[3px] text-xs font-medium capitalize"
      style={{ color: s.fg, background: s.bg, borderRadius: 4 }}
    >
      {state}
    </span>
  );
}

/* ── Row overflow menu ─────────────────────────────────────── */

function RowMenu({
  onEdit,
  onCancel,
  canCancel,
  busy,
}: {
  onEdit: () => void;
  onCancel: () => Promise<void>;
  canCancel: boolean;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 14,
    color: "var(--ink-soft)",
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center transition-colors"
        style={{
          borderRadius: 5,
          color: "var(--ink-muted)",
          background: open ? "var(--surface-dim)" : "transparent",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="3" r="1.4" fill="currentColor" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
          <circle cx="8" cy="13" r="1.4" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-52 overflow-hidden py-1"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(20,19,26,0.10)",
          }}
        >
          {confirming ? (
            <div className="px-3 py-2.5">
              <div className="text-sm font-medium">Cancel this booking?</div>
              <p className="mt-1 mb-3" style={LABEL}>
                It will be removed from revenue.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await onCancel();
                    setOpen(false);
                    setConfirming(false);
                  }}
                  className="flex-1 py-1.5 text-xs font-medium"
                  style={{
                    background: "var(--danger)",
                    color: "#fff",
                    borderRadius: 4,
                  }}
                >
                  {busy ? "Cancelling…" : "Yes, cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-1.5 text-xs"
                  style={{
                    border: "1px solid var(--line)",
                    color: "var(--ink-soft)",
                    borderRadius: 4,
                  }}
                >
                  Keep
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                style={item}
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
              >
                Edit booking
              </button>
              {canCancel && (
                <button
                  type="button"
                  style={{ ...item, color: "var(--danger)" }}
                  onClick={() => setConfirming(true)}
                >
                  Cancel booking
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Row ───────────────────────────────────────────────────── */

function BookingRow({
  b,
  onVerify,
  onEdit,
  onUpdated,
}: {
  b: BookingItem;
  onVerify: (id: number, v: boolean) => Promise<void>;
  onEdit: (b: BookingItem) => void;
  onUpdated: (b: BookingItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [rowErr, setRowErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const when = formatWhen(b.scheduled_at);

  async function toggleVerify() {
    setBusy(true);
    setRowErr(null);
    try {
      await onVerify(b.id, !b.id_verified);
    } catch {
      setRowErr("Couldn't update ID status.");
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    setBusy(true);
    setRowErr(null);
    try {
      onUpdated(await cancelBooking(b.id));
    } catch {
      setRowErr("Couldn't cancel this booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`grid grid-cols-1 gap-2.5 px-4 py-3 lg:items-center lg:gap-4 ${COLS}`}
      style={{ borderTop: "1px solid var(--line)" }}
    >
      {/* Customer */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-medium">{b.customer_name}</span>
          <span style={LABEL}>{b.customer_age}y</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <a
            href={`tel:${b.customer_phone}`}
            className="text-sm"
            style={{ ...NUM, color: "var(--ink-soft)" }}
          >
            {b.customer_phone}
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(b.public_token);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            title="Copy ticket code"
            style={{ ...LABEL, ...NUM }}
          >
            {copied ? "copied" : `#${b.public_token.slice(0, 8)}`}
          </button>
        </div>
      </div>

      {/* When */}
      <div>
        <div
          className="text-sm"
          style={{ color: when.isToday ? "var(--accent)" : "var(--ink)" }}
        >
          {when.rel}
        </div>
        <div style={{ ...LABEL, ...NUM }}>{when.time}</div>
      </div>

      {/* Loadout */}
      <div className="min-w-0">
        <div className="truncate text-sm">{b.gun_category_name}</div>
        <div style={LABEL}>
          {b.shot_count} shots · {b.num_people}{" "}
          {b.num_people === 1 ? "player" : "players"}
        </div>
      </div>

      {/* Amount */}
      <div className="lg:text-right">
        <div className="text-sm font-semibold" style={NUM}>
          {money(b.amount_paise)}
        </div>
        <div className="capitalize" style={LABEL}>
          {b.payment_method}
        </div>
      </div>

      {/* Status + verify */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge state={b.state} />
        <button
          type="button"
          onClick={toggleVerify}
          disabled={busy}
          title={
            b.id_verified
              ? `${b.id_type} verified — click to undo`
              : `Mark ${b.id_type} as checked`
          }
          className="inline-flex items-center gap-1.5 px-2 py-[3px] text-xs font-medium transition-colors"
          style={{
            borderRadius: 4,
            border: `1px solid ${b.id_verified ? "var(--success)" : "var(--line)"}`,
            color: b.id_verified ? "var(--success)" : "var(--ink-soft)",
            background: b.id_verified
              ? "rgba(18,133,90,0.07)"
              : "var(--surface)",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "…" : b.id_verified ? "✓ ID checked" : "Check ID"}
        </button>
        {rowErr && (
          <span style={{ ...LABEL, color: "var(--danger)" }}>{rowErr}</span>
        )}
      </div>

      {/* Menu */}
      <div className="lg:flex lg:justify-end">
        <RowMenu
          onEdit={() => onEdit(b)}
          onCancel={doCancel}
          canCancel={b.state !== "cancelled"}
          busy={busy}
        />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<BookingItem[]>([]);
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookingItem | null>(null);
  const [showCash, setShowCash] = useState(false);

  const reqRef = useRef(0);

  const load = useCallback(
    async (
      nextState: string,
      nextSearch: string,
      off: number,
      append: boolean,
    ) => {
      const seq = ++reqRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setErr(null);
      try {
        const data = await fetchBookings({
          state: nextState || undefined,
          q: nextSearch || undefined,
          limit: PAGE,
          offset: off,
        });
        if (seq !== reqRef.current) return;
        setHasMore(data.length === PAGE);
        setRows((prev) => (append ? [...prev, ...data] : data));
        setOffset(off + data.length);
      } catch {
        if (seq !== reqRef.current) return;
        setErr("Couldn't load bookings.");
        if (!append) setRows([]);
      } finally {
        if (seq === reqRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    load(state, search, 0, false);
  }, [state, search, load]);

  function onUpdated(updated: BookingItem) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function onVerify(id: number, verified: boolean) {
    const updated = await verifyBooking(id, verified);
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  const todayCount = useMemo(() => {
    const t = startOfDay(new Date()).getTime();
    return rows.filter(
      (r) =>
        startOfDay(new Date(r.scheduled_at)).getTime() === t &&
        r.state === "confirmed",
    ).length;
  }, [rows]);

  const unverified = useMemo(
    () => rows.filter((r) => r.state === "confirmed" && !r.id_verified).length,
    [rows],
  );

  const filtered = state || search;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <div className="mt-1" style={{ ...LABEL, fontSize: 13 }}>
            {loading
              ? "Loading…"
              : `${rows.length} shown${hasMore ? "+" : ""} · ${todayCount} confirmed today${
                  unverified ? ` · ${unverified} awaiting ID check` : ""
                }`}
          </div>
        </div>
        <button
          onClick={() => setShowCash(true)}
          className="text-sm font-medium"
          style={{
            background: "var(--accent)",
            color: "#fff",
            borderRadius: 5,
            padding: "9px 16px",
          }}
        >
          + New booking
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const on = state === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setState(f.key)}
                className="text-sm transition-colors"
                style={{
                  padding: "6px 13px",
                  borderRadius: 5,
                  border: `1px solid ${on ? "var(--ink)" : "var(--line)"}`,
                  background: on ? "var(--ink)" : "var(--surface)",
                  color: on ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(q);
              if (e.key === "Escape") {
                setQ("");
                setSearch("");
              }
            }}
            placeholder="Search name or ticket code"
            className="text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 5,
              color: "var(--ink)",
              padding: "8px 12px",
              width: 260,
            }}
          />
          <button
            onClick={() => setSearch(q)}
            className="text-sm"
            style={{
              border: "1px solid var(--line)",
              borderRadius: 5,
              padding: "8px 14px",
              background: "var(--surface)",
              color: "var(--ink-soft)",
            }}
          >
            Search
          </button>
          {search && (
            <button
              onClick={() => {
                setQ("");
                setSearch("");
              }}
              className="text-sm"
              style={{ color: "var(--ink-muted)", padding: "8px 4px" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

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
            onClick={() => load(state, search, 0, false)}
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <Card>
        <div
          className={`hidden px-4 py-2.5 lg:grid lg:gap-4 ${COLS}`}
          style={{ ...LABEL, background: "var(--surface-dim)" }}
        >
          <div>Customer</div>
          <div>Session</div>
          <div>Loadout</div>
          <div className="text-right">Amount</div>
          <div>Status</div>
          <div />
        </div>

        {loading && rows.length === 0 ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-4"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <span
                  className="block animate-pulse"
                  style={{
                    height: 14,
                    width: `${45 + (i % 3) * 15}%`,
                    borderRadius: 3,
                    background: "var(--surface-dim)",
                  }}
                />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div
            className="px-6 py-14 text-center"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <div className="font-medium">
              {filtered ? "No bookings match those filters" : "No bookings yet"}
            </div>
            <p
              className="mx-auto mt-1.5 max-w-sm"
              style={{ ...LABEL, fontSize: 13 }}
            >
              {filtered
                ? "Try a different status, or clear the search."
                : "Walk-in and online bookings will appear here as they come in."}
            </p>
            {filtered ? (
              <button
                onClick={() => {
                  setState("");
                  setQ("");
                  setSearch("");
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
            ) : (
              <button
                onClick={() => setShowCash(true)}
                className="mt-4 text-sm font-medium"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: 5,
                  padding: "8px 16px",
                }}
              >
                + New booking
              </button>
            )}
          </div>
        ) : (
          rows.map((b) => (
            <BookingRow
              key={b.id}
              b={b}
              onVerify={onVerify}
              onEdit={setEditing}
              onUpdated={onUpdated}
            />
          ))
        )}
      </Card>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => load(state, search, offset, true)}
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

      {showCash && (
        <CashBookingModal
          onClose={() => setShowCash(false)}
          onCreated={(b) => setRows((prev) => [b, ...prev])}
        />
      )}
      {editing && (
        <EditBookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={onUpdated}
        />
      )}
    </div>
  );
}
