import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createBooking } from "../api/client";
import { openRazorpay } from "../api/razorpay";
import TechFrame from "../components/TechFrame";

const ID_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "pan", label: "PAN" },
  { value: "other", label: "Other" },
] as const;

export default function CheckoutPage() {
  //const { sessionId, planId } = useParams();
  const { planId } = useParams();
  const navigate = useNavigate();

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

  const scheduledAt = useMemo(() => {
    if (!date) return null;
    let h = parseInt(hour, 10) % 12;
    if (ampm === "PM") h += 12;
    const d = new Date(`${date}T00:00:00`);
    d.setHours(h, parseInt(minute, 10), 0, 0);
    return d;
  }, [date, hour, minute, ampm]);

  const isFuture = scheduledAt ? scheduledAt.getTime() > Date.now() : false;
  const dateValid = date && isFuture;
  const phoneDigits = phone.replace(/\D/g, "").replace(/^91/, "");
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits);

  const valid =
    name.trim() &&
    Number(age) >= 1 &&
    consent &&
    dateValid &&
    phoneValid &&
    !submitting;

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
  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    padding: "0.7rem 0.9rem",
    width: "100%",
    fontFamily: "var(--font-display)",
  };

  return (
    <div className="min-h-screen">
      <div className="hazard hazard-live h-2 w-full" />

      <div
        className="flex items-center justify-between px-6 py-2"
        style={{
          borderBottom: "1px solid var(--line)",
          color: "var(--ink-muted)",
        }}
      >
        <Link
          to={-1 as any}
          className="tech-label"
          style={{ color: "var(--ink-soft)" }}
        >
          ← Slots
        </Link>
        <span className="tech-label" style={{ color: "var(--accent)" }}>
          ※ Step 03 // Details
        </span>
      </div>

      <main className="max-w-lg mx-auto px-6 pt-12 pb-16">
        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-bold tracking-tight mb-8"
        >
          YOUR <span style={{ color: "var(--accent)" }}>DETAILS</span>
        </motion.h1>

        <TechFrame className="p-6">
          <div className="space-y-5">
            <div>
              <label
                className="tech-label block mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                Date
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]} // can't pick past days
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                className="tech-label block mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                Time
              </label>
              <div className="flex gap-2">
                <select
                  style={inputStyle}
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
                  style={inputStyle}
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
                      className="px-4 tech-label clip-corner"
                      style={{
                        border: `1px solid ${ampm === p ? "var(--accent)" : "var(--line)"}`,
                        color: ampm === p ? "var(--accent)" : "var(--ink-soft)",
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
                  ⚠ Pick a time in the future
                </div>
              )}
            </div>
            <div>
              <label
                className="tech-label block mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                Full name
              </label>
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As on ID"
              />
            </div>
            <div>
              <label
                className="tech-label block mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                Mobile number
              </label>
              <input
                style={inputStyle}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="tech-label block mb-2"
                  style={{ color: "var(--ink-muted)" }}
                >
                  Age
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="tech-label block mb-2"
                  style={{ color: "var(--ink-muted)" }}
                >
                  People
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  max={10}
                  value={people}
                  onChange={(e) =>
                    setPeople(Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
            </div>

            <div>
              <label
                className="tech-label block mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                ID to bring
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ID_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setIdType(t.value)}
                    className="py-2 tech-label transition-colors"
                    style={{
                      border: `1px solid ${idType === t.value ? "var(--accent)" : "var(--line)"}`,
                      color:
                        idType === t.value
                          ? "var(--accent)"
                          : "var(--ink-soft)",
                      background:
                        idType === t.value
                          ? "var(--accent-wash)"
                          : "transparent",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
                style={{ accentColor: "var(--accent)" }}
              />
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                I confirm all participants will follow range safety rules and I
                consent to the liability terms.
              </span>
            </label>

            {error && (
              <div className="tech-label" style={{ color: "var(--danger)" }}>
                ⚠ {error}
              </div>
            )}

            <motion.button
              onClick={handleSubmit}
              disabled={!valid}
              whileHover={valid ? { y: -2 } : undefined}
              whileTap={valid ? { scale: 0.98 } : undefined}
              className="w-full py-4 clip-corner tech-label font-bold"
              style={{
                background: valid ? "var(--accent)" : "var(--surface-dim)",
                color: valid ? "#fff" : "var(--ink-muted)",
                cursor: valid ? "pointer" : "not-allowed",
                letterSpacing: "0.15em",
              }}
            >
              {submitting ? "◆ Opening payment…" : "Pay with UPI →"}
            </motion.button>
          </div>
        </TechFrame>

        <p
          className="tech-label mt-4 text-center"
          style={{ color: "var(--ink-muted)" }}
        >
          ID verified at the counter · Secure UPI via Razorpay
        </p>
      </main>
      <div className="hazard hazard-live h-2 w-full" />
    </div>
  );
}
