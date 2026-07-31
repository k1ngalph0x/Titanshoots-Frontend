import { useState } from "react";
import { motion } from "framer-motion";
import { updateBooking, type BookingItem } from "../../api/admin";

export default function EditBookingModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: BookingItem;
  onClose: () => void;
  onSaved: (b: BookingItem) => void;
}) {
  const [name, setName] = useState(booking.customer_name);
  const [phone, setPhone] = useState(booking.customer_phone);
  const [age, setAge] = useState(String(booking.customer_age));
  const [amount, setAmount] = useState(
    String(Math.round(booking.amount_paise / 100)),
  );
  // const [loyaltyPct, setLoyaltyPct] = useState(
  //   booking.loyalty_discount_percent ?? 0,
  // );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // const basePaise =
  //   booking.amount_paise + (booking.loyalty_discount_paise ?? 0);
  // const previewDiscountPaise =
  //   Math.round((basePaise * loyaltyPct) / 100 / 100) * 100;
  // const previewFinal = basePaise - previewDiscountPaise;
  const amountChanged =
    Number(amount) !== Math.round(booking.amount_paise / 100);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const updated = await updateBooking(booking.id, {
        customer_name: name.trim(),
        customer_phone: phone,
        customer_age: Number(age),
        amount_rupees: Number(amount),
      });
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Could not save.");
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
        className="clip-corner w-full max-w-md"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
        }}
      >
        <div className="hazard h-2 w-full" />
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">EDIT BOOKING</h2>
          <div>
            <label className="tech-label block mb-1.5" style={label}>
              Name
            </label>
            <input
              style={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tech-label block mb-1.5" style={label}>
                Phone
              </label>
              <input
                style={input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="tech-label block mb-1.5" style={label}>
                Age
              </label>
              <input
                style={input}
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="tech-label block mb-1.5" style={label}>
              Amount (Rs)
            </label>
            <input
              style={input}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {amountChanged && (
              <div
                className="tech-label mt-1.5"
                style={{ color: "var(--warning)" }}
              >
                ⚠ Changes reported revenue — not what was charged to the
                customer. Refunds are handled in Razorpay.
              </div>
            )}
          </div>
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
              onClick={save}
              disabled={busy}
              className="flex-1 py-3 clip-corner tech-label font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {busy ? "◆ Saving…" : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
