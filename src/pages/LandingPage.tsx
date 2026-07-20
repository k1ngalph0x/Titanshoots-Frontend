import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import SiteHeader from "../components/SiteHeader";

import heroOperator from "../assets/hero-operator.png";
import gearHelmet from "../assets/gear-helmet.png";
import duoAction from "../assets/duo-action.png";
import { Divider } from "../components/Divider";

const EASE = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  {
    tag: "01",
    title: "Standard Arsenal",
    desc: "A full rack of precision markers for every skill level. Grab a pack of shots and lock in.",
  },
  {
    tag: "02",
    title: "Special Guns",
    desc: "High-spec markers for the serious shooter. More power, more range, more bragging rights.",
  },
  {
    tag: "03",
    title: "Shooting Gallery",
    desc: "A purpose-built indoor range engineered for safety and adrenaline in equal measure.",
  },
  {
    tag: "04",
    title: "Retractable Targets",
    desc: "Smart pop-up targets that react as you fire — reflex-testing, score-tracking, relentless.",
  },
] as const;

const EXPERIENCE = [
  { k: "Guns", v: "10+" },
  { k: "Shot packs", v: "30–50" },
  { k: "Book online", v: "UPI" },
  { k: "Group play", v: "Yes" },
] as const;

const GEAR_SPEC = [
  { k: "Model", v: "TS-HELM / M02" },
  { k: "Class", v: "Full-face" },
  { k: "Optics", v: "Anti-fog" },
  { k: "Status", v: "In service" },
] as const;

/* ── Decode-in text: scrambles then resolves on mount ──────── */
const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#*";
function useDecode(target: string, enabled: boolean, speed = 28) {
  const [out, setOut] = useState(enabled ? target : target);
  useEffect(() => {
    if (!enabled) {
      setOut(target);
      return;
    }
    let frame = 0;
    const total = target.length;
    const id = setInterval(() => {
      frame++;
      const revealed = Math.floor(frame / 2);
      setOut(
        target
          .split("")
          .map((ch, i) =>
            ch === " "
              ? " "
              : i < revealed
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(""),
      );
      if (revealed >= total) {
        clearInterval(id);
        setOut(target);
      }
    }, speed);
    return () => clearInterval(id);
  }, [target, enabled, speed]);
  return out;
}

/* ── Marquee band ──────────────────────────────────────────── */
function Marquee({ items, reduce }: { items: string[]; reduce: boolean }) {
  const row = [...items, ...items, ...items];
  return (
    <div
      className="relative flex overflow-hidden py-4 select-none"
      style={{
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
      }}
      aria-hidden="true"
    >
      <motion.div
        className="flex shrink-0 items-center gap-8 whitespace-nowrap pr-8"
        animate={reduce ? undefined : { x: ["0%", "-33.333%"] }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
      >
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-8 text-3xl font-bold uppercase tracking-tight sm:text-4xl"
          >
            <span style={{ color: i % 2 ? "var(--accent)" : "var(--ink)" }}>
              {t}
            </span>
            <span style={{ color: "var(--accent)" }}>✳</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Magnetic button wrapper ───────────────────────────────── */
function Magnetic({
  children,
  reduce,
}: {
  children: React.ReactNode;
  reduce: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });
  return (
    <motion.span
      ref={ref}
      style={{
        x: reduce ? 0 : sx,
        y: reduce ? 0 : sy,
        display: "inline-block",
      }}
      onMouseMove={(e) => {
        if (reduce || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

function Reticle({ size = 44 }: { size?: number }) {
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

function CornerBrackets() {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "var(--accent)",
    pointerEvents: "none",
  };
  return (
    <>
      <span
        style={{
          ...s,
          top: 0,
          left: 0,
          borderTop: "1.5px solid",
          borderLeft: "1.5px solid",
        }}
      />
      <span
        style={{
          ...s,
          top: 0,
          right: 0,
          borderTop: "1.5px solid",
          borderRight: "1.5px solid",
        }}
      />
      <span
        style={{
          ...s,
          bottom: 0,
          left: 0,
          borderBottom: "1.5px solid",
          borderLeft: "1.5px solid",
        }}
      />
      <span
        style={{
          ...s,
          bottom: 0,
          right: 0,
          borderBottom: "1.5px solid",
          borderRight: "1.5px solid",
        }}
      />
    </>
  );
}

export default function LandingPage() {
  const reduce = !!useReducedMotion();

  /* Scroll parallax for the hero */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const typeY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  /* Mouse parallax layers */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 120, damping: 20 });
  const smy = useSpring(my, { stiffness: 120, damping: 20 });
  const imgMX = useTransform(smx, (v) => v * (reduce ? 0 : 22));
  const imgMY = useTransform(smy, (v) => v * (reduce ? 0 : 22));
  const glowMX = useTransform(smx, (v) => v * (reduce ? 0 : -34));
  const glowMY = useTransform(smy, (v) => v * (reduce ? 0 : -34));

  const headline1 = useDecode("LOCK IN.", !reduce);
  const headline2 = useDecode("TAKE THE SHOT.", !reduce, 34);

  const fade: Variants = {
    hidden: {
      opacity: 0,
      y: reduce ? 0 : 26,
      filter: reduce ? "none" : "blur(6px)",
    },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: EASE },
    },
  };

  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        aria-labelledby="hero-title"
        className="relative"
        style={{ borderBottom: "1px solid var(--line)" }}
        onMouseMove={(e) => {
          const w = window.innerWidth,
            h = window.innerHeight;
          mx.set((e.clientX / w - 0.5) * 2);
          my.set((e.clientY / h - 0.5) * 2);
        }}
      >
        <motion.div
          className="grid-bg absolute inset-0 opacity-20"
          style={{ y: gridY }}
        />

        {/* accent glow blob behind operator */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute right-[6%] top-[18%] hidden h-[42vh] w-[42vh] rounded-full lg:block"
          style={{
            background: "var(--accent)",
            opacity: 0.12,
            filter: "blur(80px)",
            x: glowMX,
            y: glowMY,
          }}
        />

        <div
          className="tech-label absolute left-3 top-32 z-10 hidden lg:block"
          style={{
            writingMode: "vertical-rl",
            color: "var(--ink-muted)",
            letterSpacing: "0.25em",
          }}
        >
          Shooting Range · Unit 001 · Live
        </div>

        <motion.div
          style={{ opacity: heroFade }}
          className="relative mx-auto grid min-h-[88vh] max-w-6xl grid-cols-1 items-center gap-4 px-6 pb-10 pt-8 lg:grid-cols-12"
        >
          {/* Type — overlaps image via z + negative margin at the seam */}
          <motion.div
            style={{ y: typeY }}
            className="relative z-20 lg:col-span-7 lg:pl-8"
          >
            <motion.div
              initial={{ opacity: 0, x: reduce ? 0 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="tech-label mb-5"
              style={{ color: "var(--accent)" }}
            >
              ※ Paintball · Airsoft · Indoor Range
            </motion.div>

            <h1
              id="hero-title"
              className="font-bold uppercase leading-[0.82] tracking-tight"
              style={{ fontSize: "clamp(3.2rem, 9vw, 8.5rem)" }}
            >
              <span className="block">{headline1}</span>
              <span className="block" style={{ color: "var(--accent)" }}>
                {headline2}
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-7 max-w-md text-lg"
              style={{ color: "var(--ink-soft)" }}
            >
              The city's sharpest indoor shooting gallery. Real gear, reactive
              targets, and slots you can book in seconds. Bring your crew.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.6 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <Magnetic reduce={reduce}>
                <Link
                  to="/book"
                  className="clip-corner tech-label inline-block px-8 py-4 font-bold"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    letterSpacing: "0.15em",
                  }}
                >
                  Book your session →
                </Link>
              </Magnetic>
              <a
                href="#gear"
                className="clip-corner tech-label px-8 py-4"
                style={{
                  border: "1px solid var(--line-strong)",
                  color: "var(--ink)",
                }}
              >
                See what's inside
              </a>
            </motion.div>
          </motion.div>

          {/* Operator — large, offset, drifts on scroll + mouse */}
          <motion.figure
            style={{ y: imgY }}
            className="relative z-10 lg:col-span-5 lg:-ml-16"
            initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <motion.div
              style={{ x: imgMX, y: imgMY }}
              className="relative mx-auto w-full max-w-lg"
            >
              <img
                src={heroOperator}
                alt="Illustrated operator in tactical techwear holding an airsoft marker"
                width={1128}
                height={1440}
                loading="eager"
                decoding="async"
                className="w-full select-none"
                draggable={false}
                //style={{ mixBlendMode: "multiply" }}
              />
              <CornerBrackets />
              <div className="absolute right-2 top-2">
                <Reticle size={40} />
              </div>
              <div
                className="tech-label absolute bottom-3 left-3 px-3 py-1.5"
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--accent)",
                  color: "var(--ink)",
                }}
              >
                TS-00 / Operator
              </div>
            </motion.div>
          </motion.figure>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          aria-hidden="true"
          className="tech-label absolute bottom-6 left-1/2 -translate-x-1/2"
          style={{ color: "var(--ink-muted)" }}
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          ↓ Scroll
        </motion.div>
      </section>

      <Marquee
        items={["Lock in", "Take the shot", "Book your bay", "Bring the crew"]}
        reduce={reduce}
      />

      {/* ── GEAR ─────────────────────────────────────────────── */}
      <section
        id="gear"
        aria-labelledby="gear-title"
        className="mx-auto max-w-6xl px-6 py-24"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.figure
            initial={{
              opacity: 0,
              y: reduce ? 0 : 40,
              rotate: reduce ? 0 : -2,
            }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="relative mx-auto w-full max-w-sm"
          >
            <img
              src={gearHelmet}
              alt="Illustrated full-face range helmet on a display stand"
              width={1128}
              height={1440}
              loading="lazy"
              decoding="async"
              className="w-full select-none"
              draggable={false}
              //style={{ mixBlendMode: "multiply" }}
            />
            <CornerBrackets />
          </motion.figure>

          <motion.div
            variants={fade}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div className="tech-label mb-3" style={{ color: "var(--accent)" }}>
              ※ The gear
            </div>
            <h2
              id="gear-title"
              className="mb-4 text-4xl font-bold uppercase tracking-tight sm:text-5xl"
            >
              Suit up, then{" "}
              <span style={{ color: "var(--accent)" }}>lock on</span>
            </h2>
            <p className="mb-8 max-w-md" style={{ color: "var(--ink-soft)" }}>
              Every session includes full protective gear — helmets, masks, and
              padding rated for indoor play. Walk in with nothing, walk out with
              a story.
            </p>
            <dl className="grid max-w-md grid-cols-2 gap-x-8 gap-y-4">
              {GEAR_SPEC.map((s) => (
                <div
                  key={s.k}
                  style={{ borderTop: "1px solid var(--line)" }}
                  className="pt-2"
                >
                  <dt
                    className="tech-label"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {s.k}
                  </dt>
                  <dd
                    className="font-bold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section
        id="features"
        aria-labelledby="features-title"
        className="mx-auto max-w-6xl px-6 py-20"
      >
        <div className="tech-label mb-3" style={{ color: "var(--accent)" }}>
          ※ The arsenal
        </div>
        <h2
          id="features-title"
          className="mb-10 text-4xl font-bold uppercase tracking-tight sm:text-5xl"
        >
          What you get
        </h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.09 } } }}
          className="grid gap-5 sm:grid-cols-2"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.tag}
              variants={fade}
              whileHover={reduce ? undefined : { y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="clip-corner p-px"
              style={{ background: "var(--line-strong)" }}
            >
              <div
                className="clip-corner h-full p-6"
                style={{ background: "var(--surface)" }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <span
                    className="tech-label"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {f.tag} //
                  </span>
                  <span style={{ color: "var(--accent)" }}>↗</span>
                </div>
                <h3 className="mb-2 text-2xl font-bold">{f.title}</h3>
                <p style={{ color: "var(--ink-soft)" }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── SQUAD BANNER ─────────────────────────────────────── */}
      <section
        aria-labelledby="squad-title"
        className="relative overflow-hidden"
      >
        <Divider variant="ticks" />
        <div style={{ background: "var(--surface)" }}>
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-6 py-14 lg:grid-cols-[1fr_1.2fr]">
            <motion.div
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
            >
              <div
                className="tech-label mb-3"
                style={{ color: "var(--accent)" }}
              >
                ※ Group play
              </div>
              <h2
                id="squad-title"
                className="text-5xl font-bold uppercase leading-[0.9] tracking-tight sm:text-6xl"
              >
                Squad up.
                <br />
                <span style={{ color: "var(--accent)" }}>Split the tab.</span>
              </h2>
              <p className="mt-5 max-w-sm" style={{ color: "var(--ink-soft)" }}>
                Bigger crews get bigger discounts. Book together, play together,
                settle up together.
              </p>
            </motion.div>
            <motion.figure
              initial={{ opacity: 0, x: reduce ? 0 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <img
                src={duoAction}
                alt="Two illustrated players in techwear back-to-back holding markers"
                width={1512}
                height={1008}
                loading="lazy"
                decoding="async"
                className="w-full select-none"
                draggable={false}
                //style={{ mixBlendMode: "multiply" }}
              />
            </motion.figure>
          </div>
        </div>
        <Divider variant="ticks" />
      </section>

      {/* ── EXPERIENCE ───────────────────────────────────────── */}
      <section
        aria-label="At a glance"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-16 sm:grid-cols-4">
          {EXPERIENCE.map((e, i) => (
            <motion.div
              key={e.k}
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="text-center"
            >
              <div
                className="mb-1 text-5xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                {e.v}
              </div>
              <div className="tech-label" style={{ color: "var(--ink-muted)" }}>
                {e.k}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────── */}
      <section
        aria-labelledby="cta-title"
        className="relative mx-auto max-w-6xl px-6 py-28 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: reduce ? 1 : 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-6 flex justify-center"
        >
          <Reticle size={52} />
        </motion.div>
        <motion.h2
          id="cta-title"
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-5xl font-bold uppercase tracking-tight sm:text-7xl"
        >
          Ready to <span style={{ color: "var(--accent)" }}>fire</span>?
        </motion.h2>
        <p
          className="mx-auto mb-8 max-w-md"
          style={{ color: "var(--ink-soft)" }}
        >
          Pick a slot, grab your loadout, and show up. It's that simple.
        </p>
        <Magnetic reduce={reduce}>
          <Link
            to="/book"
            className="clip-corner tech-label inline-block px-10 py-4 font-bold"
            style={{
              background: "var(--accent)",
              color: "#fff",
              letterSpacing: "0.15em",
            }}
          >
            Book now →
          </Link>
        </Magnetic>
      </section>

      <Divider variant="rule" />
      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <span className="text-lg font-bold">
          Titan<span style={{ color: "var(--accent)" }}>Shoots</span>
        </span>
        <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
          © TitanShoots · Book responsibly
        </span>
      </footer>
    </div>
  );
}
