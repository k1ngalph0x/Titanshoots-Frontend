import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Catalog } from "../api/client";
import { fetchCatalog } from "../api/client";
import {
  createCashBooking,
  createUpiBooking,
  fetchBookings,
  type BookingItem,
} from "../api/admin";

export default function CashBookingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: BookingItem) => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [planId, setPlanId] = useState<number | "">("");
  const [people, setPeople] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState<"aadhaar" | "pan" | "other">("aadhaar");
  const [idVerified, setIdVerified] = useState(true);
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("06");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState<"AM" | "PM">("PM");
  const [method, setMethod] = useState<"cash" | "upi">("cash");
  const [qr, setQr] = useState<{ image: string; token: string } | null>(null);

  useEffect(() => {
    fetchCatalog().then(setCatalog);
  }, []);

  const plansForCat = useMemo(
    () => catalog?.categories.find((c) => c.id === categoryId)?.plans ?? [],
    [catalog, categoryId],
  );
  const plan = plansForCat.find((p) => p.id === planId);
  const estimate = plan ? plan.price_paise * people : 0;

  const scheduledAt = useMemo(() => {
    if (!date) return null;
    let h = parseInt(hour, 10) % 12;
    if (ampm === "PM") h += 12;
    const d = new Date(`${date}T00:00:00`);
    d.setHours(h, parseInt(minute, 10), 0, 0);
    return d;
  }, [date, hour, minute, ampm]);

  const isFuture = scheduledAt ? scheduledAt.getTime() > Date.now() : false;
  const phoneValid = /^[6-9]\d{9}$/.test(
    phone.replace(/\D/g, "").replace(/^91/, ""),
  );
  const valid =
    !!planId &&
    !!name.trim() &&
    Number(age) >= 1 &&
    consent &&
    isFuture &&
    phoneValid &&
    !busy;
  async function submit() {
    if (!scheduledAt) {
      setErr("Pick a date and time.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const payload = {
        plan_id: Number(planId),
        scheduled_at: scheduledAt.toISOString(),
        num_people: people,
        customer_name: name.trim(),
        customer_age: Number(age),
        id_type: idType,
        id_verified: idVerified,
        customer_phone: phone.replace(/\D/g, "").replace(/^91/, ""),
        consent_given: consent,
      };
      if (method === "cash") {
        const b = await createCashBooking(payload);
        onCreated(b);
        onClose();
      } else {
        const res = await createUpiBooking(payload);
        setQr({ image: res.qr_image_url, token: res.booking_token });
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Could not create booking.");
    } finally {
      setBusy(false);
    }
  }

  const input = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    padding: "0.6rem 0.8rem",
    width: "100%",
    fontFamily: "var(--font-display)",
  };
  const label = { color: "var(--ink-muted)" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20,19,26,0.55)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="clip-corner w-full max-w-lg"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
        }}
      >
        <div className="hazard h-2 w-full" />
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="tech-label mb-1" style={{ color: "var(--accent)" }}>
            ※ Walk-in
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-5">
            NEW BOOKING
          </h2>

          {qr ? (
            <div className="text-center py-4">
              <div
                className="tech-label mb-3"
                style={{ color: "var(--accent)" }}
              >
                ◆ Scan to pay
              </div>
              <img
                src={qr.image}
                alt="UPI QR"
                className="mx-auto"
                style={{ width: 220, height: 220 }}
              />
              <p className="mt-3 text-sm" style={{ color: "var(--ink-soft)" }}>
                Customer scans with any UPI app. Confirms automatically.
              </p>
              <QrPollStatus
                token={qr.token}
                onConfirmed={(b) => {
                  onCreated(b);
                  onClose();
                }}
              />
              <button
                onClick={onClose}
                className="mt-4 py-2 px-5 clip-corner tech-label"
                style={{
                  border: "1px solid var(--line)",
                  color: "var(--ink-soft)",
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["cash", "upi"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className="flex-1 py-2 tech-label clip-corner"
                    style={{
                      border: `1px solid ${method === m ? "var(--accent)" : "var(--line)"}`,
                      color: method === m ? "var(--accent)" : "var(--ink-soft)",
                      background:
                        method === m ? "var(--accent-wash)" : "transparent",
                    }}
                  >
                    {m === "cash" ? "Cash" : "UPI QR"}
                  </button>
                ))}
              </div>

              <div>
                <label className="tech-label block mb-1.5" style={label}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  style={input}
                />
              </div>

              <div>
                <label className="tech-label block mb-1.5" style={label}>
                  Time
                </label>
                <div className="flex gap-2">
                  <select
                    style={input}
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) =>
                      String(i + 1).padStart(2, "0"),
                    ).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    style={input}
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    {(["AM", "PM"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmPm(p)}
                        className="px-3 tech-label clip-corner"
                        style={{
                          border: `1px solid ${ampm === p ? "var(--accent)" : "var(--line)"}`,
                          color:
                            ampm === p ? "var(--accent)" : "var(--ink-soft)",
                          background:
                            ampm === p ? "var(--accent-wash)" : "transparent",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {date && !isFuture && (
                  <div
                    className="tech-label mt-2"
                    style={{ color: "var(--danger)" }}
                  >
                    ⚠ Pick a future time
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="tech-label block mb-1.5" style={label}>
                    Gun class
                  </label>
                  <select
                    style={input}
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(Number(e.target.value) || "");
                      setPlanId("");
                    }}
                  >
                    <option value="">Select…</option>
                    {catalog?.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="tech-label block mb-1.5" style={label}>
                    Shot pack
                  </label>
                  <select
                    style={input}
                    value={planId}
                    onChange={(e) => setPlanId(Number(e.target.value) || "")}
                    disabled={!categoryId}
                  >
                    <option value="">Select…</option>
                    {plansForCat.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.shot_count} · {p.price_display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="tech-label block mb-1.5" style={label}>
                    People
                  </label>
                  <input
                    style={input}
                    type="number"
                    min={1}
                    value={people}
                    onChange={(e) =>
                      setPeople(Math.max(1, Number(e.target.value)))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="tech-label block mb-1.5" style={label}>
                    Customer name
                  </label>
                  <input
                    style={input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="tech-label block mb-1.5" style={label}>
                  Mobile number
                </label>
                <input
                  style={input}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                />
                {phone && !phoneValid && (
                  <div
                    className="tech-label mt-1"
                    style={{ color: "var(--danger)" }}
                  >
                    Enter a valid 10-digit mobile
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="tech-label block mb-1.5" style={label}>
                    Age
                  </label>
                  <input
                    style={input}
                    type="number"
                    min={1}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="tech-label block mb-1.5" style={label}>
                    ID type
                  </label>
                  <select
                    style={input}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as any)}
                  >
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                  ID checked at counter
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                  Safety consent given
                </span>
              </label>

              {plan && (
                <div
                  className="flex justify-between items-center pt-2"
                  style={{ borderTop: "1px solid var(--line)" }}
                >
                  <span className="tech-label" style={label}>
                    Subtotal
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    ₹{(estimate / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {err && (
                <div className="tech-label" style={{ color: "var(--danger)" }}>
                  ⚠ {err}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 clip-corner tech-label"
                  style={{
                    border: "1px solid var(--line)",
                    color: "var(--ink-soft)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!valid}
                  className="flex-1 py-3 clip-corner tech-label font-bold"
                  style={{
                    background: valid ? "var(--accent)" : "var(--surface-dim)",
                    color: valid ? "#fff" : "var(--ink-muted)",
                    cursor: valid ? "pointer" : "not-allowed",
                  }}
                >
                  {busy
                    ? "◆ Working…"
                    : method === "cash"
                      ? "Confirm cash →"
                      : "Generate QR →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function QrPollStatus({
  token,
  onConfirmed,
}: {
  token: string;
  onConfirmed: (b: BookingItem) => void;
}) {
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const rows = await fetchBookings({ q: token, limit: 1 });
        const b = rows[0];
        if (!stop && b && b.state === "confirmed") {
          onConfirmed(b);
          return;
        }
      } catch {
        /* keep polling */
      }
      if (!stop) setTimeout(poll, 2500);
    };
    const t = setTimeout(poll, 2500);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [token, onConfirmed]);

  return (
    <div
      className="tech-label blink mt-4"
      style={{ color: "var(--ink-muted)" }}
    >
      ◆ Waiting for payment…
    </div>
  );
}
