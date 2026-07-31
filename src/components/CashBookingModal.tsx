import { useEffect, useMemo, useRef, useState } from "react";
import type { Catalog } from "../api/client";
import { fetchCatalog } from "../api/client";
import {
  createCashBooking,
  createUpiBooking,
  fetchBookings,
  type BookingItem,
} from "../api/admin";

const LABEL: React.CSSProperties = { color: "var(--ink-muted)", fontSize: 12 };
const NUM: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

const field: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 5,
  color: "var(--ink)",
  padding: "9px 11px",
  width: "100%",
  fontSize: 14,
  fontFamily: "var(--font-display)",
};

function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-medium"
        style={{ ...LABEL, fontSize: 13 }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div className="mt-1" style={{ ...LABEL, color: "var(--danger)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3
        className="mb-3 pb-2 text-sm font-semibold"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function CashBookingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: BookingItem) => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogErr, setCatalogErr] = useState(false);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [planId, setPlanId] = useState<number | "">("");
  const [people, setPeople] = useState(1);
  const [name, setName] = useState("");
  const [loyaltyPct, setLoyaltyPct] = useState(0);
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

  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch(() => setCatalogErr(true));
  }, []);

  useEffect(() => {
    firstRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const plansForCat = useMemo(
    () => catalog?.categories.find((c) => c.id === categoryId)?.plans ?? [],
    [catalog, categoryId],
  );
  const plan = plansForCat.find((p) => p.id === planId);

  const baseEstimate = plan
    ? (plan.discounted_price_paise || plan.price_paise) * people
    : 0;
  const loyaltyDiscountPaise =
    Math.round((baseEstimate * loyaltyPct) / 100 / 100) * 100;
  const estimate = baseEstimate - loyaltyDiscountPaise;

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
  const ageValid = Number(age) >= 1;
  const valid =
    !!planId &&
    !!name.trim() &&
    ageValid &&
    consent &&
    isFuture &&
    phoneValid &&
    !busy;

  const blocker = !date
    ? "Pick a date"
    : !isFuture
      ? "Session time must be in the future"
      : !planId
        ? "Choose a gun class and shot pack"
        : !name.trim()
          ? "Enter the customer's name"
          : !phoneValid
            ? "Enter a valid 10-digit mobile number"
            : !ageValid
              ? "Enter the customer's age"
              : !consent
                ? "Safety consent is required"
                : null;

  const todayLocal = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

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
        loyalty_discount_percent: loyaltyPct,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      style={{ background: "rgba(20,19,26,0.45)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newbooking-title"
        onClick={(e) => e.stopPropagation()}
        className="my-auto flex w-full max-w-xl flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          boxShadow: "0 16px 48px rgba(20,19,26,0.18)",
          maxHeight: "92vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-6 py-4"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div>
            <h2 id="newbooking-title" className="text-lg font-semibold">
              New booking
            </h2>
            <p className="mt-0.5" style={{ ...LABEL, fontSize: 13 }}>
              Walk-in at the counter
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center"
            style={{ borderRadius: 5, color: "var(--ink-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {qr ? (
          <div className="px-6 py-8 text-center">
            <div className="text-sm font-medium">Scan to pay</div>
            <p
              className="mx-auto mt-1 max-w-xs"
              style={{ ...LABEL, fontSize: 13 }}
            >
              Customer scans with any UPI app. The booking confirms
              automatically.
            </p>
            <div
              className="mx-auto mt-5 inline-block p-3"
              style={{ border: "1px solid var(--line)", borderRadius: 6 }}
            >
              <img
                src={qr.image}
                alt="UPI QR code"
                style={{ width: 220, height: 220, display: "block" }}
              />
            </div>
            <div className="mt-4 text-2xl font-semibold" style={NUM}>
              ₹{(estimate / 100).toLocaleString("en-IN")}
            </div>
            <QrPollStatus
              token={qr.token}
              onConfirmed={(b) => {
                onCreated(b);
                onClose();
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="mt-6 text-sm"
              style={{
                border: "1px solid var(--line)",
                borderRadius: 5,
                padding: "8px 18px",
                color: "var(--ink-soft)",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
              {catalogErr && (
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    background: "var(--surface)",
                    borderRadius: 4,
                    border: "1px solid var(--line)",
                    borderLeft: "3px solid var(--danger)",
                  }}
                >
                  Couldn't load the catalog. Close and reopen to retry.
                </div>
              )}

              {/* Payment method */}
              <div>
                <div
                  className="mb-2 font-medium"
                  style={{ ...LABEL, fontSize: 13 }}
                >
                  Payment method
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { k: "cash", t: "Cash", s: "Confirm immediately" },
                      { k: "upi", t: "UPI QR", s: "Customer scans to pay" },
                    ] as const
                  ).map((m) => {
                    const on = method === m.k;
                    return (
                      <button
                        key={m.k}
                        type="button"
                        onClick={() => setMethod(m.k)}
                        className="px-3 py-2.5 text-left transition-colors"
                        style={{
                          borderRadius: 5,
                          border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`,
                          background: on
                            ? "var(--accent-wash)"
                            : "var(--surface)",
                        }}
                      >
                        <div
                          className="text-sm font-medium"
                          style={{ color: on ? "var(--accent)" : "var(--ink)" }}
                        >
                          {m.t}
                        </div>
                        <div style={LABEL}>{m.s}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session */}
              <Section title="Session">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date" htmlFor="nb-date">
                    <input
                      ref={firstRef}
                      id="nb-date"
                      type="date"
                      value={date}
                      min={todayLocal}
                      onChange={(e) => setDate(e.target.value)}
                      style={field}
                    />
                  </Field>

                  <Field
                    label="Time"
                    hint={
                      date && !isFuture ? "Must be in the future" : undefined
                    }
                  >
                    <div className="flex gap-2">
                      <select
                        aria-label="Hour"
                        style={{ ...field, width: "auto", flex: 1 }}
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
                        aria-label="Minute"
                        style={{ ...field, width: "auto", flex: 1 }}
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                      >
                        {["00", "15", "30", "45"].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <div
                        className="flex shrink-0 overflow-hidden"
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 5,
                        }}
                      >
                        {(["AM", "PM"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setAmPm(p)}
                            className="px-3 text-sm font-medium transition-colors"
                            style={{
                              background:
                                ampm === p ? "var(--ink)" : "transparent",
                              color:
                                ampm === p ? "var(--paper)" : "var(--ink-soft)",
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Field>
                </div>
              </Section>

              {/* Loadout */}
              <Section title="Loadout">
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_100px]">
                  <Field label="Gun class" htmlFor="nb-cat">
                    <select
                      id="nb-cat"
                      style={field}
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
                  </Field>

                  <Field label="Shot pack" htmlFor="nb-plan">
                    <select
                      id="nb-plan"
                      style={field}
                      value={planId}
                      disabled={!categoryId}
                      onChange={(e) => setPlanId(Number(e.target.value) || "")}
                    >
                      <option value="">
                        {categoryId ? "Select…" : "Pick a class first"}
                      </option>
                      {/* {plansForCat.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.shot_count} shots · {p.price_display}
                        </option>
                      ))} */}
                      {plansForCat.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.shot_count} shots ·{" "}
                          {p.discounted_display || p.price_display}
                          {p.discount_percent > 0
                            ? ` (−${p.discount_percent}%)`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Players" htmlFor="nb-people">
                    <input
                      id="nb-people"
                      style={field}
                      type="number"
                      min={1}
                      value={people}
                      onChange={(e) =>
                        setPeople(Math.max(1, Number(e.target.value)))
                      }
                    />
                  </Field>

                  <Field label="Loyalty discount" htmlFor="nb-loyalty">
                    <select
                      id="nb-loyalty"
                      style={field}
                      value={loyaltyPct}
                      onChange={(e) => setLoyaltyPct(Number(e.target.value))}
                    >
                      {Array.from({ length: 21 }, (_, i) => i * 5).map((p) => (
                        <option key={p} value={p}>
                          {p === 0 ? "None" : `${p}%`}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              {/* Customer */}
              <Section title="Customer">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    htmlFor="nb-name"
                    className="sm:col-span-2"
                  >
                    <input
                      id="nb-name"
                      style={field}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="As on ID"
                    />
                  </Field>

                  <Field
                    label="Mobile number"
                    htmlFor="nb-phone"
                    hint={
                      phone && !phoneValid
                        ? "Must be a valid 10-digit number"
                        : undefined
                    }
                  >
                    <input
                      id="nb-phone"
                      style={field}
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile"
                    />
                  </Field>

                  <Field label="Age" htmlFor="nb-age">
                    <input
                      id="nb-age"
                      style={field}
                      type="number"
                      min={1}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </Field>

                  <Field
                    label="ID type"
                    htmlFor="nb-idtype"
                    className="sm:col-span-2"
                  >
                    <select
                      id="nb-idtype"
                      style={field}
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as any)}
                    >
                      <option value="aadhaar">Aadhaar</option>
                      <option value="pan">PAN</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-4 space-y-2.5">
                  {[
                    {
                      on: idVerified,
                      set: setIdVerified,
                      t: "ID checked at counter",
                    },
                    {
                      on: consent,
                      set: setConsent,
                      t: "Safety consent given",
                      req: true,
                    },
                  ].map((c) => (
                    <label
                      key={c.t}
                      className="flex cursor-pointer items-center gap-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={c.on}
                        onChange={(e) => c.set(e.target.checked)}
                        style={{
                          accentColor: "var(--accent)",
                          width: 15,
                          height: 15,
                        }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        {c.t}
                        {c.req && (
                          <span style={{ color: "var(--danger)" }}> *</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </Section>

              {err && (
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    background: "var(--surface)",
                    borderRadius: 4,
                    border: "1px solid var(--line)",
                    borderLeft: "3px solid var(--danger)",
                  }}
                >
                  {err}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="shrink-0 px-6 py-4"
              style={{
                borderTop: "1px solid var(--line)",
                background: "var(--paper)",
              }}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <span style={{ ...LABEL, fontSize: 13 }}>
                  {plan
                    ? `${plan.shot_count} shots × ${people} ${people === 1 ? "player" : "players"}`
                    : "Total"}
                </span>
                <span className="text-xl font-semibold" style={NUM}>
                  ₹{(estimate / 100).toLocaleString("en-IN")}
                </span>
              </div>

              {loyaltyPct > 0 && plan && (
                <div
                  className="mb-3 flex items-baseline justify-between"
                  style={{ ...LABEL, fontSize: 13 }}
                >
                  <span>Loyalty −{loyaltyPct}%</span>
                  <span style={{ ...NUM, color: "var(--success)" }}>
                    −₹{(loyaltyDiscountPaise / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {blocker && (
                <div className="mb-3" style={{ ...LABEL, fontSize: 13 }}>
                  {blocker}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm"
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 5,
                    background: "var(--surface)",
                    color: "var(--ink-soft)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!valid}
                  className="flex-[1.4] py-2.5 text-sm font-medium"
                  style={{
                    borderRadius: 5,
                    background: valid ? "var(--accent)" : "var(--surface-dim)",
                    color: valid ? "#fff" : "var(--ink-muted)",
                    cursor: valid ? "pointer" : "not-allowed",
                  }}
                >
                  {busy
                    ? "Working…"
                    : method === "cash"
                      ? "Confirm cash booking"
                      : "Generate UPI QR"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
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
      className="mt-4 flex items-center justify-center gap-2"
      style={{ ...LABEL, fontSize: 13 }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: "var(--warning)",
          animation: "pulse 1.6s ease-in-out infinite",
        }}
      />
      Waiting for payment…
    </div>
  );
}
