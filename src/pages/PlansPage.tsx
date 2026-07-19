import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchCatalog, type Catalog } from "../api/client";
import TechFrame from "../components/TechFrame";
import { useCountUp } from "../hooks/useCountUp";
import { useNavigate } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16, clipPath: "inset(0 100% 0 0)" },
  show: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function PlansPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch(() => setError("Could not load plans."));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="hazard hazard-live h-2 w-full" />
      <div
        className="flex items-center justify-between px-6 py-2 text-xs"
        style={{
          borderBottom: "1px solid var(--line)",
          color: "var(--ink-muted)",
        }}
      >
        <span className="tech-label">TitanShoots // Booking Terminal</span>
        <span
          className="tech-label flex items-center gap-1.5"
          style={{ color: "var(--accent)" }}
        >
          <span className="blink">◆</span> Live
        </span>
      </div>

      <header className="max-w-5xl mx-auto px-6 pt-14 pb-8">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="tech-label mb-3"
          style={{ color: "var(--accent)" }}
        >
          ※ Select your loadout
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-6xl font-bold tracking-tight leading-none"
        >
          TITAN<span style={{ color: "var(--accent)" }}>SHOOTS</span>
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

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {error && (
          <div className="tech-label" style={{ color: "var(--danger)" }}>
            ⚠ {error}
          </div>
        )}
        {!catalog && !error && (
          <div
            className="tech-label blink"
            style={{ color: "var(--ink-muted)" }}
          >
            ◆ Loading terminal…
          </div>
        )}

        {catalog?.categories.map((cat, ci) => (
          <section key={cat.id} className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-4 mb-5"
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

        {/* {catalog && catalog.group_discounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <TechFrame className="p-5 scanline">
              <div className="flex items-center gap-4">
                <span className="hazard hazard-live w-10 h-10 clip-corner shrink-0" />
                <div>
                  <div
                    className="tech-label"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    Group booking
                  </div>
                  <div className="text-lg font-medium">
                    Book together and save up to{" "}
                    <span style={{ color: "var(--success)" }}>
                      {
                        catalog.group_discounts[
                          catalog.group_discounts.length - 1
                        ].discount_display
                      }
                    </span>
                  </div>
                </div>
              </div>
            </TechFrame>
          </motion.div>
        )} */}
      </main>

      <div className="hazard hazard-live h-2 w-full" />
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
  onSelect,
}: {
  prefix: string;
  shots: number;
  price: string;
  discountPercent: number;
  discountedPrice: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(shots, 700, true);

  return (
    <motion.button
      onClick={onSelect}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="text-left w-full"
      style={
        selected
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
            animate={{ x: hovered ? 3 : 0, y: hovered ? -3 : 0 }}
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

        <div
          className="mt-4 pt-4 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          {/* <span
            className="text-2xl font-bold"
            style={{ color: "var(--accent)" }}
          >
            {price}
          </span> */}
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
