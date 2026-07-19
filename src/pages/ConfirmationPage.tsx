import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBookingStatus, type BookingStatus } from "../api/client";
import { api } from "../api/client";
import TechFrame from "../components/TechFrame";

export default function ConfirmationPage() {
  const { token } = useParams();
  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let stop = false;
    const poll = async () => {
      try {
        const s = await fetchBookingStatus(token);
        if (stop) return;
        setStatus(s);
        if (s.state === "confirmed" || s.state === "expired") return; // done
      } catch {
        /* keep polling */
      }
      setElapsed((e) => e + 1);
      pollRef.current = window.setTimeout(poll, 2500);
    };
    poll();
    return () => {
      stop = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [token]);

  const confirmed = status?.state === "confirmed";
  const expired = status?.state === "expired";

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              key="ok"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ImpactBurst />
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                <TechFrame active className="p-8 text-center scanline">
                  <div
                    className="tech-label mb-3"
                    style={{ color: "var(--success)" }}
                  >
                    ◆ Confirmed
                  </div>
                  <div className="text-4xl font-bold mb-2">LOCKED IN</div>
                  <p style={{ color: "var(--ink-soft)" }}>
                    You're booked, {status?.customer_name}. Bring your ID to the
                    counter.
                  </p>
                  <a
                    href={`${api.defaults.baseURL}/bookings/${token}/ticket`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-6 px-8 py-3 clip-corner tech-label font-bold"
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      letterSpacing: "0.15em",
                    }}
                  >
                    Download ticket ↓
                  </a>
                </TechFrame>
              </motion.div>
            </motion.div>
          ) : expired ? (
            <motion.div
              key="exp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <TechFrame className="p-8 text-center">
                <div
                  className="tech-label mb-3"
                  style={{ color: "var(--danger)" }}
                >
                  ⚠ Expired
                </div>
                <div className="text-2xl font-bold mb-2">Hold released</div>
                <p style={{ color: "var(--ink-soft)" }}>
                  Payment wasn't completed in time. Please book again.
                </p>
              </TechFrame>
            </motion.div>
          ) : (
            <motion.div
              key="wait"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <TechFrame className="p-8 text-center">
                <div
                  className="tech-label blink mb-3"
                  style={{ color: "var(--accent)" }}
                >
                  ◆ Awaiting payment
                </div>
                <div className="text-2xl font-bold mb-2">Confirming…</div>
                <p style={{ color: "var(--ink-soft)" }}>
                  Complete the UPI payment. This updates the moment it clears.
                </p>
                <div
                  className="mt-4 h-1 w-full"
                  style={{ background: "var(--surface-dim)" }}
                >
                  <motion.div
                    className="h-full"
                    style={{ background: "var(--accent)" }}
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </div>
              </TechFrame>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// the "explosion" — radial shards bursting outward on confirm
function ImpactBurst() {
  const shards = Array.from({ length: 14 });
  return (
    <div className="relative h-0">
      {shards.map((_, i) => {
        const angle = (i / shards.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-0 w-2 h-2"
            style={{ background: i % 2 ? "var(--accent)" : "var(--success)" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * 160,
              y: Math.sin(angle) * 160,
              opacity: 0,
              scale: 0.3,
              rotate: 180,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
