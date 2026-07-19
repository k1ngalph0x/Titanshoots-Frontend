import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchBookings,
  verifyBooking,
  type BookingItem,
} from "../../api/admin";
import TechFrame from "../../components/TechFrame";
import CashBookingModal from "../../components/CashBookingModal";
const PAGE = 50;
const FILTERS = [
  { key: "", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "expired", label: "Expired" },
];

const money = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<BookingItem[]>([]);
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [showCash, setShowCash] = useState(false);

  async function load(reset = false) {
    setLoading(true);
    const off = reset ? 0 : offset;
    const data = await fetchBookings({
      state: state || undefined,
      q: search || undefined,
      limit: PAGE,
      offset: off,
    });
    setHasMore(data.length === PAGE);
    setRows((prev) => (reset ? data : [...prev, ...data]));
    setOffset(off + data.length);
    setLoading(false);
  }
  useEffect(() => {
    load(true);
  }, [state, search]);

  async function onVerify(id: number, verified: boolean) {
    const updated = await verifyBooking(id, verified);
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  return (
    <div>
      <div className="tech-label mb-2" style={{ color: "var(--accent)" }}>
        ※ Ledger
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold tracking-tight">BOOKINGS</h1>
        <button
          onClick={() => setShowCash(true)}
          className="px-5 py-2.5 clip-corner tech-label font-bold"
          style={{
            background: "var(--accent)",
            color: "#fff",
            letterSpacing: "0.1em",
          }}
        >
          + Cash booking
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setState(f.key)}
              className="px-4 py-2 tech-label clip-corner"
              style={{
                background: state === f.key ? "var(--accent)" : "transparent",
                color: state === f.key ? "#fff" : "var(--ink-soft)",
                border: `1px solid ${state === f.key ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(q)}
            placeholder="Name or ticket code"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              padding: "0.55rem 0.8rem",
              fontFamily: "var(--font-display)",
              width: 220,
            }}
          />
          <button
            onClick={() => setSearch(q)}
            className="px-4 clip-corner tech-label"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Search
          </button>
          {search && (
            <button
              onClick={() => {
                setQ("");
                setSearch("");
              }}
              className="px-3 clip-corner tech-label"
              style={{
                border: "1px solid var(--line)",
                color: "var(--ink-soft)",
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading && rows.length === 0 && (
        <div className="tech-label blink" style={{ color: "var(--ink-muted)" }}>
          ◆ Loading…
        </div>
      )}
      {!loading && rows.length === 0 && (
        <TechFrame className="p-8 text-center">
          <p style={{ color: "var(--ink-soft)" }}>No bookings match.</p>
        </TechFrame>
      )}

      <div className="space-y-2">
        {rows.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 12) * 0.02 }}
          >
            <BookingRow b={b} onVerify={onVerify} />
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
      {showCash && (
        <CashBookingModal
          onClose={() => setShowCash(false)}
          onCreated={(b) => setRows((prev) => [b, ...prev])}
        />
      )}
    </div>
  );
}

function BookingRow({
  b,
  onVerify,
}: {
  b: BookingItem;
  onVerify: (id: number, v: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const d = new Date(b.scheduled_at);
  const when = d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const stateColor =
    b.state === "confirmed"
      ? "var(--success)"
      : b.state === "pending"
        ? "var(--warning)"
        : "var(--ink-muted)";

  return (
    <TechFrame className="p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="min-w-44 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{b.customer_name}</span>
            <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
              age {b.customer_age}
            </span>
          </div>
          <div
            className="tech-label mt-0.5"
            style={{ color: "var(--ink-muted)" }}
          >
            {b.gun_category_name} · {b.shot_count} shots · {b.num_people}p
          </div>
        </div>

        <div className="min-w-32">
          <div className="tech-label" style={{ color: "var(--ink-muted)" }}>
            {when} IST
          </div>
          <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
            {money(b.amount_paise)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="tech-label px-2 py-1 clip-corner"
            style={{ border: `1px solid ${stateColor}`, color: stateColor }}
          >
            {b.state}
          </span>
          <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
            {b.payment_method}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
            {b.id_type}
          </span>
          {b.id_verified ? (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onVerify(b.id, false);
                } finally {
                  setBusy(false);
                }
              }}
              className="tech-label px-3 py-1.5 clip-corner"
              style={{
                border: "1px solid var(--success)",
                color: "var(--success)",
              }}
            >
              ✓ ID verified
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onVerify(b.id, true);
                } finally {
                  setBusy(false);
                }
              }}
              className="tech-label px-3 py-1.5 clip-corner font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {busy ? "…" : "Verify ID"}
            </button>
          )}
        </div>
      </div>
    </TechFrame>
  );
}
