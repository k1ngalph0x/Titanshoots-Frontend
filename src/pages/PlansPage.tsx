import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { fetchCatalog, type Catalog } from "../api/client";
import TechFrame from "../components/TechFrame";
import { Divider } from "../components/Divider";
import { useCountUp } from "../hooks/useCountUp";
import { useNavigate } from "react-router-dom";

const EASE = [0.22, 1, 0.36, 1] as const;

function Reticle({ size = 40 }: { size?: number }) {
  const c = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle
        cx={c}
        cy={c}
        r={size * 0.34}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1"
      />
      <line x1={c} y1="2" x2={c} y2={size * 0.24} stroke="var(--accent)" />
      <line
        x1={c}
        y1={size - 2}
        x2={c}
        y2={size * 0.76}
        stroke="var(--accent)"
      />
      <line x1="2" y1={c} x2={size * 0.24} y2={c} stroke="var(--accent)" />
      <line
        x1={size - 2}
        y1={c}
        x2={size * 0.76}
        y2={c}
        stroke="var(--accent)"
      />
      <circle cx={c} cy={c} r="2" fill="var(--accent)" />
    </svg>
  );
}

export default function PlansPage() {
  const reduce = !!useReducedMotion();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch(() => setError("Could not load plans."));
  }, []);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: {
      opacity: 0,
      y: reduce ? 0 : 16,
      clipPath: reduce ? "none" : "inset(0 100% 0 0)",
    },
    show: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0 0% 0 0)",
      transition: { duration: 0.4, ease: EASE },
    },
  };

  return (
    <div className="min-h-screen">
      <Divider
        variant="status"
        label="TitanShoots · Booking terminal · Bookings open"
      />

      <header className="mx-auto max-w-5xl px-6 pb-8 pt-14">
        <motion.div
          initial={{ opacity: 0, x: reduce ? 0 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="tech-label mb-3"
          style={{ color: "var(--accent)" }}
        >
          ※ Select your loadout
        </motion.div>
        <motion.h1
          initial={{
            opacity: 0,
            clipPath: reduce ? "none" : "inset(0 100% 0 0)",
          }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-6xl font-bold uppercase leading-none tracking-tight"
        >
          Titan<span style={{ color: "var(--accent)" }}>Shoots</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 max-w-md"
          style={{ color: "var(--ink-soft)" }}
        >
          Choose a gun class and shot pack. Lock your slot, pay by UPI, and
          you're on the range.
        </motion.p>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        {error && (
          <div
            role="alert"
            className="tech-label clip-corner p-4"
            style={{
              color: "var(--danger)",
              border: "1px solid var(--danger)",
              background: "var(--accent-wash)",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {!catalog && !error && (
          <div
            className="flex items-center gap-3 py-8"
            style={{ color: "var(--ink-muted)" }}
          >
            <span className="blink">
              <Reticle size={22} />
            </span>
            <span className="tech-label">Loading terminal…</span>
          </div>
        )}

        {catalog?.categories.map((cat, ci) => (
          <section key={cat.id} className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-5 flex items-center gap-4"
            >
              <span
                className="tech-label"
                style={{ color: "var(--ink-muted)" }}
              >
                0{ci + 1} //
              </span>
              <h2 className="text-2xl font-bold uppercase tracking-wide">
                {cat.name}
              </h2>
              <span
                className="h-px flex-1"
                style={{ background: "var(--line)" }}
              />
              <span
                className="tech-label"
                style={{ color: "var(--ink-muted)" }}
              >
                {cat.plans.length} packs
              </span>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-4 sm:grid-cols-3"
            >
              {cat.plans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <PlanCard
                    prefix={cat.name.slice(0, 3)}
                    shots={plan.shot_count}
                    price={plan.price_display}
                    discountPercent={plan.discount_percent}
                    discountedPrice={plan.discounted_display}
                    selected={selected === plan.id}
                    reduce={reduce}
                    onSelect={() => {
                      setSelected(plan.id);
                      setTimeout(() => navigate(`/checkout/${plan.id}`), 280);
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        ))}

        {/* 
        {catalog && catalog.group_discounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <TechFrame className="p-5">
              <div className="flex items-center gap-4">
                <span className="shrink-0"><Reticle size={40} /></span>
                <div>
                  <div className="tech-label" style={{ color: "var(--ink-muted)" }}>
                    Group booking
                  </div>
                  <div className="text-lg font-medium">
                    Book together and save up to{" "}
                    <span style={{ color: "var(--success)" }}>
                      {catalog.group_discounts[catalog.group_discounts.length - 1].discount_display}
                    </span>
                  </div>
                </div>
              </div>
            </TechFrame>
          </motion.div>
        )} */}
      </main>

      <Divider variant="rule" />
    </div>
  );
}

function PlanCard({
  prefix,
  shots,
  price,
  discountPercent,
  discountedPrice,
  selected,
  reduce,
  onSelect,
}: {
  prefix: string;
  shots: number;
  price: string;
  discountPercent: number;
  discountedPrice: string;
  selected: boolean;
  reduce: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(shots, 700, true);

  return (
    <motion.button
      onClick={onSelect}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      aria-pressed={selected}
      aria-label={`${prefix} — ${shots} shots, ${discountPercent > 0 ? discountedPrice : price}`}
      className="w-full text-left"
      style={
        selected && !reduce
          ? { animation: "accent-pulse 1.6s ease-in-out infinite" }
          : undefined
      }
    >
      <TechFrame active={selected || hovered} className="p-5">
        <div className="flex items-start justify-between">
          <span
            className="tech-label"
            style={{ color: selected ? "var(--accent)" : "var(--ink-muted)" }}
          >
            {prefix}-{shots}
          </span>
          <motion.span
            animate={
              reduce ? undefined : { x: hovered ? 3 : 0, y: hovered ? -3 : 0 }
            }
            style={{
              color: selected || hovered ? "var(--accent)" : "var(--ink-muted)",
            }}
          >
            ↗
          </motion.span>
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-5xl font-bold leading-none tabular-nums">
            {count}
          </span>
          <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
            shots
          </span>
        </div>

        {/* round counter — shots-as-tier, echoes the hero's magazine bar */}
        <div className="mt-4 flex gap-1" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1"
              style={{
                background:
                  i < Math.round((count / Math.max(shots, 1)) * 8)
                    ? "var(--accent)"
                    : "var(--line)",
              }}
            />
          ))}
        </div>

        <div
          className="mt-4 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "var(--line)" }}
        >
          {discountPercent > 0 ? (
            <span className="flex items-baseline gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                {discountedPrice}
              </span>
              <span
                className="text-sm line-through"
                style={{ color: "var(--ink-muted)" }}
              >
                {price}
              </span>
            </span>
          ) : (
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--accent)" }}
            >
              {price}
            </span>
          )}
          {selected && (
            <span className="tech-label" style={{ color: "var(--accent)" }}>
              ✓ Locked
            </span>
          )}
        </div>
      </TechFrame>
    </motion.button>
  );
}
