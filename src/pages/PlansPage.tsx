import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { fetchCatalog, type Catalog } from "../api/client";
import SiteHeader from "../components/SiteHeader";
import { useCountUp } from "../hooks/useCountUp";

const EASE = [0.22, 1, 0.36, 1] as const;

type Category = Catalog["categories"][number];
type Plan = Category["plans"][number];

const STEPS = ["Loadout", "Your details", "Pay"] as const;

/* Effective price after the plan's own discount, in paise.
   Display strings still come from the API — this is only for
   per-shot comparison and best-value ranking. */
function effectivePaise(p: Plan) {
  return p.discount_percent > 0
    ? Math.round((p.price_paise * (100 - p.discount_percent)) / 100)
    : p.price_paise;
}

function perShot(p: Plan) {
  return effectivePaise(p) / 100 / Math.max(p.shot_count, 1);
}

/* ── HUD primitives ────────────────────────────────────────── */

function Reticle({
  size = 40,
  tone = "var(--accent)",
}: {
  size?: number;
  tone?: string;
}) {
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
        stroke={tone}
        strokeWidth="1"
      />
      <line x1={c} y1="2" x2={c} y2={size * 0.24} stroke={tone} />
      <line x1={c} y1={size - 2} x2={c} y2={size * 0.76} stroke={tone} />
      <line x1="2" y1={c} x2={size * 0.24} y2={c} stroke={tone} />
      <line x1={size - 2} y1={c} x2={size * 0.76} y2={c} stroke={tone} />
      <circle cx={c} cy={c} r="2" fill={tone} />
    </svg>
  );
}

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

/* ── Steps ─────────────────────────────────────────────────── */

function StepBar() {
  return (
    <ol
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
      aria-label="Booking steps"
    >
      {STEPS.map((s, i) => {
        const active = i === 0;
        return (
          <li key={s} className="flex items-center gap-3">
            <span
              className="tech-label flex items-center gap-2"
              style={{ color: active ? "var(--accent)" : "var(--ink-muted)" }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center"
                style={{
                  border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#fff" : "var(--ink-muted)",
                  fontSize: "0.6rem",
                }}
              >
                {i + 1}
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

/* ── Plan card ─────────────────────────────────────────────── */

function PlanCard({
  plan,
  prefix,
  maxShots,
  bestValue,
  selected,
  reduce,
  onSelect,
}: {
  plan: Plan;
  prefix: string;
  maxShots: number;
  bestValue: boolean;
  selected: boolean;
  reduce: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(plan.shot_count, 700, true);

  const SEGMENTS = 10;
  const filled = Math.max(
    1,
    Math.round((plan.shot_count / Math.max(maxShots, 1)) * SEGMENTS),
  );
  const rate = perShot(plan);
  const on = selected || hovered;
  const cut = { "--cut": "20px" } as React.CSSProperties;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={reduce ? undefined : { y: -5 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      aria-pressed={selected}
      aria-label={`${prefix} ${plan.shot_count} shots, ${
        plan.discount_percent > 0 ? plan.discounted_display : plan.price_display
      }${bestValue ? ", best value" : ""}`}
      className="relative w-full text-left"
      style={cut}
    >
      <div
        className="clip-corner p-px transition-colors duration-200"
        style={{
          ...cut,
          background: on ? "var(--accent)" : "var(--line-strong)",
        }}
      >
        <div
          className="clip-corner relative p-5"
          style={{ ...cut, background: "var(--surface)" }}
        >
          {bestValue && (
            <span
              className="tech-label absolute right-0 top-0 px-2.5 py-1"
              style={{ background: "var(--cyan)", color: "#fff" }}
            >
              Best value
            </span>
          )}

          <div
            className="tech-label"
            style={{ color: on ? "var(--accent)" : "var(--ink-muted)" }}
          >
            {prefix}-{plan.shot_count}
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-5xl font-bold leading-none tabular-nums">
              {count}
            </span>
            <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
              shots
            </span>
          </div>

          {/* Segments now encode pack size relative to the largest in this class */}
          <div className="mt-4 flex gap-1" aria-hidden="true">
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 transition-colors duration-300"
                style={{
                  background:
                    i < filled
                      ? on
                        ? "var(--accent)"
                        : "var(--ink)"
                      : "var(--line)",
                }}
              />
            ))}
          </div>

          <div
            className="mt-5 flex items-end justify-between gap-3 pt-4"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <div>
              {plan.discount_percent > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    {plan.discounted_display}
                  </span>
                  <span
                    className="text-sm line-through"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {plan.price_display}
                  </span>
                </div>
              ) : (
                <span
                  className="text-2xl font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {plan.price_display}
                </span>
              )}
              <div
                className="tech-label mt-1"
                style={{ color: "var(--cyan)", fontFamily: "var(--font-mono)" }}
              >
                ₹{rate.toFixed(1)} / shot
              </div>
            </div>

            <span
              className="tech-label shrink-0"
              style={{
                color: selected
                  ? "var(--accent)"
                  : on
                    ? "var(--ink)"
                    : "var(--ink-muted)",
              }}
            >
              {selected ? "✓ Locked" : "Select →"}
            </span>
          </div>

          {plan.discount_percent > 0 && (
            <span
              className="tech-label absolute bottom-0 left-0 px-2.5 py-1"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              −{plan.discount_percent}%
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ── Skeleton ──────────────────────────────────────────────── */

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="clip-corner p-px"
          style={{ background: "var(--line)" }}
        >
          <div
            className="clip-corner p-5"
            style={{ background: "var(--surface)" }}
          >
            <span
              className="block h-3 w-16 animate-pulse"
              style={{ background: "var(--surface-dim)" }}
            />
            <span
              className="mt-6 block h-10 w-24 animate-pulse"
              style={{ background: "var(--surface-dim)" }}
            />
            <span
              className="mt-5 block h-1.5 w-full animate-pulse"
              style={{ background: "var(--surface-dim)" }}
            />
            <span
              className="mt-6 block h-7 w-28 animate-pulse"
              style={{ background: "var(--surface-dim)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function PlansPage() {
  const reduce = !!useReducedMotion();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCatalog()
      .then(setCatalog)
      .catch(() =>
        setError(
          "Couldn't load the loadouts. Check your connection and try again.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Sort by shot count, and precompute best value per class. */
  const sections = useMemo(() => {
    return (catalog?.categories ?? [])
      .filter((c) => c.plans.length > 0)
      .map((cat) => {
        const plans = [...cat.plans].sort(
          (a, b) => a.shot_count - b.shot_count,
        );
        const maxShots = Math.max(...plans.map((p) => p.shot_count));
        const bestId =
          plans.length > 1
            ? plans.reduce((a, b) => (perShot(b) < perShot(a) ? b : a)).id
            : null;
        return { cat, plans, maxShots, bestId };
      });
  }, [catalog]);

  const picked = useMemo(() => {
    for (const s of sections) {
      const p = s.plans.find((x) => x.id === selectedId);
      if (p) return { plan: p, category: s.cat };
    }
    return null;
  }, [sections, selectedId]);

  const groups = catalog?.group_discounts ?? [];

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
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
      transition: { duration: 0.45, ease: EASE },
    },
  };

  return (
    <div className="range-cursor min-h-screen overflow-x-clip">
      <SiteHeader />

      {/* Hero strip */}
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--line-strong)" }}
      >
        <div className="grid-bg absolute inset-0 opacity-[0.18]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-14">
          <div className="tech-label mb-4" style={{ color: "var(--accent)" }}>
            ※ Step 01 · Select your loadout
          </div>
          <h1
            className="font-bold uppercase leading-[0.85] tracking-tight"
            style={{ fontSize: "clamp(2.75rem, 8vw, 6.5rem)" }}
          >
            Pick your <span style={{ color: "var(--accent)" }}>pack</span>
          </h1>
          <p
            className="mt-6 max-w-md text-lg"
            style={{ color: "var(--ink-soft)" }}
          >
            Choose a gun class and shot pack. Lock your slot, pay by UPI, and
            you're on the range.
          </p>
          <div className="mt-8">
            <StepBar />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pb-40 pt-14">
        {error && (
          <div
            role="alert"
            className="clip-corner mb-10 flex flex-wrap items-center justify-between gap-4 p-5"
            style={{
              border: "1px solid var(--danger)",
              background: "var(--accent-wash)",
            }}
          >
            <span style={{ color: "var(--ink)" }}>{error}</span>
            <button
              onClick={load}
              className="clip-corner tech-label px-5 py-2.5 font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Try again
            </button>
          </div>
        )}

        {loading && !catalog && !error && (
          <div className="mb-12">
            <div
              className="tech-label mb-5 flex items-center gap-3"
              style={{ color: "var(--ink-muted)" }}
            >
              <span className="blink">
                <Reticle size={20} />
              </span>
              Loading loadouts…
            </div>
            <SkeletonGrid />
          </div>
        )}

        {!loading && !error && sections.length === 0 && (
          <HudFrame label="Sec 00 / Empty" className="mb-12">
            <div className="p-10 text-center">
              <h2 className="text-2xl font-bold uppercase">
                No packs available right now
              </h2>
              <p className="mt-3" style={{ color: "var(--ink-soft)" }}>
                Give us a call and we'll sort you out at the counter.
              </p>
              <a
                href="tel:+919080549234"
                className="clip-corner tech-label mt-6 inline-block px-7 py-3.5 font-bold"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  letterSpacing: "0.15em",
                }}
              >
                +91 90805 49234
              </a>
            </div>
          </HudFrame>
        )}

        {sections.map(({ cat, plans, maxShots, bestId }, ci) => (
          <section
            key={cat.id}
            id={`class-${cat.id}`}
            className="mb-16 scroll-mt-24"
          >
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex items-baseline gap-4"
            >
              <span
                className="tech-label"
                style={{ color: "var(--ink-muted)" }}
              >
                {String(ci + 1).padStart(2, "0")} //
              </span>
              <h2 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                {cat.name}
              </h2>
              <span
                className="h-px flex-1"
                style={{ background: "var(--line)" }}
              />
              <span className="tech-label" style={{ color: "var(--cyan)" }}>
                {plans.length} {plans.length === 1 ? "pack" : "packs"}
              </span>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {plans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <PlanCard
                    plan={plan}
                    prefix={cat.name.slice(0, 3).toUpperCase()}
                    maxShots={maxShots}
                    bestValue={plan.id === bestId}
                    selected={selectedId === plan.id}
                    reduce={reduce}
                    onSelect={() => setSelectedId(plan.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        ))}

        {/* Group discounts — the landing page promises these */}
        {groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <HudFrame
              label="Sec 05 / Group play"
              code="SQD-DISC"
              tone="var(--accent)"
            >
              <div className="grid grid-cols-1 gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_1.3fr]">
                <div>
                  <div
                    className="tech-label mb-3"
                    style={{ color: "var(--cyan)" }}
                  >
                    ※ Bring the crew
                  </div>
                  <h2 className="text-3xl font-bold uppercase leading-[0.9] tracking-tight sm:text-4xl">
                    Squad up.
                    <br />
                    <span style={{ color: "var(--accent)" }}>
                      Split the tab.
                    </span>
                  </h2>
                  <p
                    className="mt-4 max-w-sm"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Discounts apply automatically at checkout once you set your
                    crew size.
                  </p>
                </div>

                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {groups.map((g: any, i: number) => (
                    <div
                      key={g.num_people ?? i}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                      style={{ border: "1px solid var(--line)" }}
                    >
                      <dt
                        className="tech-label"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        {g.num_people ? `${g.num_people}+ players` : "Group"}
                      </dt>
                      <dd
                        className="font-bold"
                        style={{
                          color: "var(--accent)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        −{g.discount_display}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </HudFrame>
          </motion.div>
        )}
      </main>

      {/* Sticky confirm bar */}
      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50"
            style={{
              borderTop: "1px solid var(--line-strong)",
              background: "var(--paper)",
            }}
          >
            <div
              className="hatch h-2 w-full"
              style={{ color: "var(--accent)" }}
            />
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <span className="hidden sm:block">
                  <Reticle size={34} />
                </span>
                <div>
                  <div
                    className="tech-label"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {picked.category.name} · {picked.plan.shot_count} shots
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      {picked.plan.discount_percent > 0
                        ? picked.plan.discounted_display
                        : picked.plan.price_display}
                    </span>
                    <span
                      className="tech-label"
                      style={{ color: "var(--cyan)" }}
                    >
                      ₹{perShot(picked.plan).toFixed(1)} / shot
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="clip-corner tech-label px-5 py-3.5"
                  style={{
                    border: "1px solid var(--line-strong)",
                    color: "var(--ink-soft)",
                  }}
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/checkout/${picked.plan.id}`)}
                  className="clip-corner tech-label px-8 py-3.5 font-bold"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    letterSpacing: "0.15em",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
