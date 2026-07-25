import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { createBooking, fetchCatalog, type Catalog } from "../api/client";
import { openRazorpay } from "../api/razorpay";
import SiteHeader from "../components/SiteHeader";

const EASE = [0.22, 1, 0.36, 1] as const;

const ID_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "pan", label: "PAN" },
  { value: "other", label: "Other" },
] as const;

const STEPS = ["Loadout", "Your details", "Pay"] as const;
const MAX_PEOPLE = 10;

type Category = Catalog["categories"][number];
type Plan = Category["plans"][number];

const inr = (paise: number) =>
  `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

function unitPaise(p: Plan) {
  return p.discount_percent > 0
    ? Math.round((p.price_paise * (100 - p.discount_percent)) / 100)
    : p.price_paise;
}

/* The public group-discount shape isn't pinned down, so read defensively. */
function groupOffPaise(g: any): number | null {
  if (typeof g?.discount_paise === "number") return g.discount_paise;
  if (typeof g?.discount_rupees === "number") return g.discount_rupees * 100;
  return null;
}

/* ── HUD primitives ────────────────────────────────────────── */

function RegMark({
  className = "",
  tone = "var(--accent)",
}: {
  className?: string;
  tone?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      className={`pointer-events-none absolute z-30 ${className}`}
    >
      <line x1="9" y1="0" x2="9" y2="18" stroke={tone} strokeWidth="0.8" />
      <line x1="0" y1="9" x2="18" y2="9" stroke={tone} strokeWidth="0.8" />
      <circle
        cx="9"
        cy="9"
        r="3.5"
        fill="none"
        stroke={tone}
        strokeWidth="0.8"
      />
    </svg>
  );
}

function HudFrame({
  children,
  label,
  code,
  cut = 28,
  className = "",
  tone = "var(--cyan)",
}: {
  children: React.ReactNode;
  label?: string;
  code?: string;
  cut?: number;
  className?: string;
  tone?: string;
}) {
  const v = { "--cut": `${cut}px` } as React.CSSProperties;
  return (
    <div className={`relative ${className}`} style={v}>
      <div
        className="clip-corner p-px"
        style={{ ...v, background: "var(--line-strong)" }}
      >
        <div
          className="clip-corner"
          style={{ ...v, background: "var(--paper)" }}
        >
          {children}
        </div>
      </div>
      {label && (
        <span
          className="tech-label absolute -top-[8px] left-8 px-2"
          style={{ background: "var(--paper)", color: "var(--ink-muted)" }}
        >
          {label}
        </span>
      )}
      {code && (
        <span
          className="tech-label absolute -bottom-[8px] right-8 px-2"
          style={{ background: "var(--paper)", color: tone }}
        >
          {code}
        </span>
      )}
      <RegMark className="-left-2 -top-2" />
      <RegMark className="-bottom-2 -right-2" tone="var(--cyan)" />
    </div>
  );
}

function StepBar({ current = 1 }: { current?: number }) {
  return (
    <ol
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
      aria-label="Booking steps"
    >
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-3">
            <span
              className="tech-label flex items-center gap-2"
              style={{
                color: active
                  ? "var(--accent)"
                  : done
                    ? "var(--cyan)"
                    : "var(--ink-muted)",
              }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center"
                style={{
                  border: `1px solid ${active ? "var(--accent)" : done ? "var(--cyan)" : "var(--line)"}`,
                  background: active ? "var(--accent)" : "transparent",
                  color: active
                    ? "#fff"
                    : done
                      ? "var(--cyan)"
                      : "var(--ink-muted)",
                  fontSize: "0.6rem",
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="h-px w-8"
                style={{ background: "var(--line)" }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Form pieces ───────────────────────────────────────────── */

const fieldStyle = (invalid = false): React.CSSProperties => ({
  background: "var(--surface)",
  border: `1px solid ${invalid ? "var(--danger)" : "var(--line)"}`,
  color: "var(--ink)",
  padding: "0.7rem 0.9rem",
  width: "100%",
  fontFamily: "var(--font-display)",
});

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
        className="tech-label mb-2 block"
        style={{ color: "var(--ink-muted)" }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div className="tech-label mt-1.5" style={{ color: "var(--danger)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Fieldset({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
          {n} //
        </span>
        <h2 className="text-xl font-bold uppercase tracking-tight">{title}</h2>
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
      </div>
      {children}
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const reduce = !!useReducedMotion();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogErr, setCatalogErr] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("06");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState<"AM" | "PM">("PM");
  const [people, setPeople] = useState(1);
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState<"aadhaar" | "pan" | "other">("aadhaar");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(() => {
    setCatalogErr(false);
    fetchCatalog()
      .then(setCatalog)
      .catch(() => setCatalogErr(true));
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const picked = useMemo(() => {
    if (!catalog) return null;
    for (const c of catalog.categories) {
      const p = c.plans.find((x) => x.id === Number(planId));
      if (p) return { category: c, plan: p };
    }
    return null;
  }, [catalog, planId]);

  /* Local date parts — toISOString() is UTC and yields yesterday before 05:30 IST. */
  const todayLocal = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const scheduledAt = useMemo(() => {
    if (!date) return null;
    let h = parseInt(hour, 10) % 12;
    if (ampm === "PM") h += 12;
    const d = new Date(`${date}T00:00:00`);
    d.setHours(h, parseInt(minute, 10), 0, 0);
    return d;
  }, [date, hour, minute, ampm]);

  const isFuture = scheduledAt ? scheduledAt.getTime() > Date.now() : false;
  const dateValid = Boolean(date && isFuture);
  const phoneDigits = phone.replace(/\D/g, "").replace(/^91/, "");
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits);
  const ageValid = Number(age) >= 1;

  const valid = Boolean(
    name.trim() &&
    ageValid &&
    consent &&
    dateValid &&
    phoneValid &&
    !submitting,
  );

  const blocker = !date
    ? "Pick a date for your session"
    : !isFuture
      ? "Pick a time in the future"
      : !name.trim()
        ? "Enter your full name"
        : !phoneValid
          ? "Enter a valid 10-digit mobile number"
          : !ageValid
            ? "Enter your age"
            : !consent
              ? "Accept the safety terms to continue"
              : null;

  /* ── Totals ── */
  const groups: any[] = (catalog as any)?.group_discounts ?? [];
  const tier = useMemo(() => {
    const eligible = groups.filter(
      (g) => people >= (g?.num_people ?? Infinity),
    );
    if (eligible.length === 0) return null;
    return eligible.reduce((a, b) =>
      (b?.num_people ?? 0) > (a?.num_people ?? 0) ? b : a,
    );
  }, [groups, people]);

  const nextTier = useMemo(() => {
    const above = groups
      .filter((g) => (g?.num_people ?? 0) > people)
      .sort((a, b) => (a?.num_people ?? 0) - (b?.num_people ?? 0));
    return above[0] ?? null;
  }, [groups, people]);

  const unit = picked ? unitPaise(picked.plan) : 0;
  const subtotal = unit * people;
  const off = tier ? groupOffPaise(tier) : null;
  const totalKnown = !tier || off !== null;
  const total = Math.max(0, subtotal - (off ?? 0));

  async function handleSubmit() {
    if (!scheduledAt) return;
    setError(null);
    setSubmitting(true);
    try {
      const checkout = await createBooking({
        plan_id: Number(planId),
        customer_phone: phoneDigits,
        scheduled_at: scheduledAt.toISOString(),
        num_people: people,
        customer_name: name.trim(),
        customer_age: Number(age),
        id_type: idType,
        consent_given: consent,
      });
      openRazorpay(checkout, name.trim(), () => setSubmitting(false));
      navigate(`/ticket/${checkout.booking_token}`);
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ?? "Could not start booking. Try again.",
      );
      setSubmitting(false);
    }
  }

  /* ── Summary body, reused in the aside and the mobile sheet ── */
  const summaryRows = picked && (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
          {picked.category.name} · {picked.plan.shot_count} shots
        </span>
        <span className="font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          {inr(unit)}
        </span>
      </div>

      {picked.plan.discount_percent > 0 && (
        <div className="tech-label mt-1" style={{ color: "var(--accent)" }}>
          Pack discount −{picked.plan.discount_percent}% applied
        </div>
      )}

      <div
        className="mt-4 flex items-baseline justify-between gap-3 pt-4"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
          × {people} {people === 1 ? "player" : "players"}
        </span>
        <span style={{ fontFamily: "var(--font-mono)" }}>{inr(subtotal)}</span>
      </div>

      {tier && (
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="tech-label" style={{ color: "var(--cyan)" }}>
            Crew discount ({tier.num_people}+)
          </span>
          <span
            style={{ color: "var(--cyan)", fontFamily: "var(--font-mono)" }}
          >
            {off !== null
              ? `−${inr(off)}`
              : `−${tier.discount_display ?? "applied"}`}
          </span>
        </div>
      )}

      <div
        className="mt-5 flex items-end justify-between gap-3 pt-4"
        style={{ borderTop: "1px solid var(--line-strong)" }}
      >
        <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
          {totalKnown ? "Total" : "Estimated"}
        </span>
        <span
          className="text-3xl font-bold leading-none"
          style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
        >
          {inr(total)}
        </span>
      </div>

      {!totalKnown && (
        <p className="tech-label mt-2" style={{ color: "var(--ink-muted)" }}>
          Crew discount confirmed at payment
        </p>
      )}

      {nextTier && (
        <p className="tech-label mt-3" style={{ color: "var(--cyan)" }}>
          + {nextTier.num_people - people} more{" "}
          {nextTier.num_people - people === 1 ? "player" : "players"} unlocks a
          bigger discount
        </p>
      )}
    </>
  );

  return (
    <div className="range-cursor min-h-screen overflow-x-clip">
      <SiteHeader />

      {/* Hero strip */}
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--line-strong)" }}
      >
        <div className="grid-bg absolute inset-0 opacity-[0.18]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-9 pt-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="tech-label mb-6 inline-block"
            style={{ color: "var(--ink-soft)" }}
          >
            ← Back to loadouts
          </button>

          <div className="tech-label mb-4" style={{ color: "var(--accent)" }}>
            ※ Step 02 · Your details
          </div>
          <h1
            className="font-bold uppercase leading-[0.85] tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            Lock it <span style={{ color: "var(--accent)" }}>in</span>
          </h1>
          <div className="mt-8">
            <StepBar current={1} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pb-44 pt-12 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* ── Form ── */}
          <div>
            <Fieldset n="01" title="When">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Date" htmlFor="co-date">
                  <input
                    id="co-date"
                    type="date"
                    value={date}
                    min={todayLocal}
                    onChange={(e) => setDate(e.target.value)}
                    style={fieldStyle()}
                  />
                </Field>

                <Field
                  label="Time"
                  hint={date && !isFuture ? "Must be in the future" : undefined}
                >
                  <div className="flex gap-2">
                    <select
                      aria-label="Hour"
                      style={fieldStyle()}
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
                      style={fieldStyle()}
                      value={minute}
                      onChange={(e) => setMinute(e.target.value)}
                    >
                      {["00", "15", "30", "45"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <div className="flex shrink-0 gap-1">
                      {(["AM", "PM"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAmPm(p)}
                          className="clip-corner tech-label px-4"
                          style={{
                            border: `1px solid ${ampm === p ? "var(--accent)" : "var(--line)"}`,
                            color: ampm === p ? "#fff" : "var(--ink-soft)",
                            background:
                              ampm === p ? "var(--accent)" : "transparent",
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>
              </div>
            </Fieldset>

            <Fieldset n="02" title="Who's shooting">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  htmlFor="co-name"
                  className="sm:col-span-2"
                >
                  <input
                    id="co-name"
                    style={fieldStyle()}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="As on your ID"
                  />
                </Field>

                <Field
                  label="Mobile number"
                  htmlFor="co-phone"
                  hint={
                    phone && !phoneValid
                      ? "Enter a valid 10-digit mobile"
                      : undefined
                  }
                >
                  <input
                    id="co-phone"
                    style={fieldStyle(Boolean(phone) && !phoneValid)}
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                  />
                </Field>

                <Field label="Age" htmlFor="co-age">
                  <input
                    id="co-age"
                    style={fieldStyle()}
                    type="number"
                    min={1}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </Field>

                <Field
                  label="Crew size"
                  htmlFor="co-people"
                  className="sm:col-span-2"
                >
                  <div className="flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => setPeople((p) => Math.max(1, p - 1))}
                      aria-label="One fewer player"
                      className="clip-corner tech-label px-5 text-lg"
                      style={{
                        border: "1px solid var(--line-strong)",
                        color: "var(--ink)",
                      }}
                    >
                      −
                    </button>
                    <input
                      id="co-people"
                      type="number"
                      min={1}
                      max={MAX_PEOPLE}
                      value={people}
                      onChange={(e) =>
                        setPeople(
                          Math.min(
                            MAX_PEOPLE,
                            Math.max(1, Number(e.target.value) || 1),
                          ),
                        )
                      }
                      style={{
                        ...fieldStyle(),
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPeople((p) => Math.min(MAX_PEOPLE, p + 1))
                      }
                      aria-label="One more player"
                      className="clip-corner tech-label px-5 text-lg"
                      style={{
                        border: "1px solid var(--line-strong)",
                        color: "var(--ink)",
                      }}
                    >
                      +
                    </button>
                  </div>
                  <p
                    className="tech-label mt-2"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    Up to {MAX_PEOPLE} per booking
                  </p>
                </Field>

                <Field label="ID you'll bring" className="sm:col-span-2">
                  <div className="grid grid-cols-3 gap-2">
                    {ID_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setIdType(t.value)}
                        aria-pressed={idType === t.value}
                        className="clip-corner tech-label py-3 transition-colors"
                        style={{
                          border: `1px solid ${idType === t.value ? "var(--accent)" : "var(--line)"}`,
                          color:
                            idType === t.value ? "#fff" : "var(--ink-soft)",
                          background:
                            idType === t.value
                              ? "var(--accent)"
                              : "transparent",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Fieldset>

            <Fieldset n="03" title="Safety">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                  style={{
                    accentColor: "var(--accent)",
                    width: 16,
                    height: 16,
                  }}
                />
                <span style={{ color: "var(--ink-soft)" }}>
                  I confirm all participants will follow range safety rules and
                  I consent to the liability terms.
                </span>
              </label>
            </Fieldset>

            {error && (
              <div
                role="alert"
                className="clip-corner mb-6 p-4"
                style={{
                  border: "1px solid var(--danger)",
                  background: "var(--accent-wash)",
                }}
              >
                <span style={{ color: "var(--ink)" }}>{error}</span>
              </div>
            )}
          </div>

          {/* ── Summary (desktop) ── */}
          <aside className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="sticky top-8"
            >
              <HudFrame
                label="Your order"
                code={picked ? `PLAN-${picked.plan.id}` : "PLAN-—"}
              >
                <div className="p-6">
                  {catalogErr ? (
                    <div>
                      <p style={{ color: "var(--ink-soft)" }}>
                        Couldn't load your pack details.
                      </p>
                      <button
                        onClick={loadCatalog}
                        className="tech-label mt-3"
                        style={{ color: "var(--accent)" }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : !catalog ? (
                    <div className="space-y-3">
                      <span
                        className="block h-3 w-32 animate-pulse"
                        style={{ background: "var(--surface-dim)" }}
                      />
                      <span
                        className="block h-8 w-24 animate-pulse"
                        style={{ background: "var(--surface-dim)" }}
                      />
                    </div>
                  ) : !picked ? (
                    <div>
                      <p style={{ color: "var(--ink-soft)" }}>
                        That pack isn't available any more.
                      </p>
                      <button
                        onClick={() => navigate("/book")}
                        className="tech-label mt-3"
                        style={{ color: "var(--accent)" }}
                      >
                        Choose another →
                      </button>
                    </div>
                  ) : (
                    summaryRows
                  )}

                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!valid}
                    whileHover={valid && !reduce ? { y: -2 } : undefined}
                    whileTap={valid && !reduce ? { scale: 0.98 } : undefined}
                    className="clip-corner tech-label mt-6 w-full py-4 font-bold"
                    style={{
                      background: valid
                        ? "var(--accent)"
                        : "var(--surface-dim)",
                      color: valid ? "#fff" : "var(--ink-muted)",
                      cursor: valid ? "pointer" : "not-allowed",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {submitting ? "Opening payment…" : "Pay with UPI →"}
                  </motion.button>

                  {blocker && (
                    <p
                      className="tech-label mt-3 text-center"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      {blocker}
                    </p>
                  )}

                  <p
                    className="tech-label mt-4 text-center"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    ID verified at the counter · Secure UPI via Razorpay
                  </p>
                </div>
              </HudFrame>
            </motion.div>
          </aside>
        </div>
      </main>

      {/* ── Summary (mobile) ── */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{
          borderTop: "1px solid var(--line-strong)",
          background: "var(--paper)",
        }}
      >
        <div className="hatch h-2 w-full" style={{ color: "var(--accent)" }} />
        <div className="px-5 py-4">
          {picked && (
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div
                  className="tech-label"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {picked.category.name} · {picked.plan.shot_count} shots ×{" "}
                  {people}
                </div>
                {tier && (
                  <div
                    className="tech-label mt-0.5"
                    style={{ color: "var(--cyan)" }}
                  >
                    Crew discount applied
                  </div>
                )}
              </div>
              <span
                className="text-2xl font-bold leading-none"
                style={{
                  color: "var(--accent)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {inr(total)}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!valid}
            className="clip-corner tech-label w-full py-4 font-bold"
            style={{
              background: valid ? "var(--accent)" : "var(--surface-dim)",
              color: valid ? "#fff" : "var(--ink-muted)",
              cursor: valid ? "pointer" : "not-allowed",
              letterSpacing: "0.15em",
            }}
          >
            {submitting ? "Opening payment…" : "Pay with UPI →"}
          </button>
          {blocker && (
            <p
              className="tech-label mt-2 text-center"
              style={{ color: "var(--ink-muted)" }}
            >
              {blocker}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
