import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useCallback, useSyncExternalStore } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import SiteHeader from "../components/SiteHeader";

import heroOperator from "../assets/hero-operator.png";
import gearHelmet from "../assets/gear-helmet.png";
import duoAction from "../assets/duo-action.png";

const EASE = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  {
    tag: "01",
    code: "ARS-STD",
    title: "Standard Arsenal",
    desc: "A full rack of precision markers for every skill level. Grab a pack of shots and lock in.",
  },
  {
    tag: "02",
    code: "ARS-SPC",
    title: "Special Guns",
    desc: "High-spec markers for the serious shooter. More power, more range, more bragging rights.",
  },
  {
    tag: "03",
    code: "BAY-GAL",
    title: "Shooting Gallery",
    desc: "A purpose-built indoor range engineered for safety and adrenaline in equal measure.",
  },
  {
    tag: "04",
    code: "TGT-RTR",
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

/* ── hooks ─────────────────────────────────────────────────── */

function useMedia(query: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#*";
function useDecode(target: string, enabled: boolean, speed = 28) {
  const [out, setOut] = useState(() => target.replace(/\S/g, "#"));

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
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
      if (revealed >= target.length) {
        clearInterval(id);
        setOut(target);
      }
    }, speed);
    return () => clearInterval(id);
  }, [target, enabled, speed]);

  return enabled ? out : target;
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

function Reticle({
  size = 44,
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

function CornerBrackets({ tone = "var(--accent)" }: { tone?: string }) {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: tone,
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

/* The container that carries the whole design language. */
function HudFrame({
  children,
  label,
  code,
  cut = 34,
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
          className="tech-label absolute -top-[8px] left-10 px-2"
          style={{ background: "var(--paper)", color: "var(--ink-muted)" }}
        >
          {label}
        </span>
      )}
      {code && (
        <span
          className="tech-label absolute -bottom-[8px] right-10 px-2"
          style={{ background: "var(--paper)", color: tone }}
        >
          {code}
        </span>
      )}

      <span
        aria-hidden="true"
        className="dot-matrix absolute -left-[10px] top-20 hidden h-14 w-4 lg:block"
        style={{ color: "var(--line-strong)" }}
      />
      <span
        aria-hidden="true"
        className="dot-matrix absolute -right-[10px] bottom-20 hidden h-14 w-4 lg:block"
        style={{ color: "var(--line-strong)" }}
      />

      <RegMark className="-left-2 -top-2" />
      <RegMark className="-bottom-2 -right-2" tone="var(--cyan)" />
    </div>
  );
}

function EdgeRail({ text, side }: { text: string; side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={`tech-label pointer-events-none absolute top-24 hidden xl:block ${side === "left" ? "left-3" : "right-3"}`}
      style={{
        writingMode: "vertical-rl",
        color: "var(--ink-muted)",
        letterSpacing: "0.3em",
      }}
    >
      {text}
    </div>
  );
}

function Counter({
  to,
  suffix = "",
  className = "",
  style,
}: {
  to: number;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 50, damping: 20 });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);
  useEffect(() => spring.on("change", (v) => setN(Math.round(v))), [spring]);
  return (
    <span ref={ref} className={className} style={style}>
      {n}
      {suffix}
    </span>
  );
}

/* ── Ticker ────────────────────────────────────────────────── */

function Ticker({ items, reduce }: { items: string[]; reduce: boolean }) {
  const row = [...items, ...items, ...items];
  return (
    <div aria-hidden="true">
      <div className="hatch h-3 w-full" style={{ color: "var(--accent)" }} />
      <div
        className="relative flex select-none overflow-hidden py-5"
        style={{
          borderTop: "1px solid var(--line-strong)",
          borderBottom: "1px solid var(--line-strong)",
          background: "var(--accent)",
        }}
      >
        <motion.div
          className="flex shrink-0 items-center gap-10 whitespace-nowrap pr-10"
          animate={reduce ? undefined : { x: ["0%", "-33.333%"] }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        >
          {row.map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-10 text-4xl font-bold uppercase tracking-tight sm:text-5xl"
            >
              <span style={{ color: i % 2 ? "#100f15" : "#ffffff" }}>{t}</span>
              <Reticle size={26} tone="#ffffff" />
            </span>
          ))}
        </motion.div>
      </div>
      <div className="hatch h-3 w-full" style={{ color: "var(--accent)" }} />
    </div>
  );
}

/* ── Magnetic ──────────────────────────────────────────────── */

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
        x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
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

/* ── Scroll spine ──────────────────────────────────────────── */

function ScrollSpine() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "84vh"]);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-6 top-0 z-40 hidden h-screen w-px xl:block"
      style={{ background: "var(--line)" }}
    >
      <motion.div
        className="absolute w-px"
        style={{ top: y, height: "16vh", background: "var(--accent)" }}
      />
    </div>
  );
}

/* ── Sticky booking bar ────────────────────────────────────── */

function StickyBook({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50"
          style={{
            borderTop: "1px solid var(--line-strong)",
            background: "var(--paper)",
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <span
              className="tech-label hidden sm:block"
              style={{ color: "var(--ink-muted)" }}
            >
              TitanShoots · Indoor Range · Bookings open
            </span>
            <Link
              to="/book"
              className="clip-corner tech-label px-6 py-3 font-bold"
              style={{
                background: "var(--accent)",
                color: "#fff",
                letterSpacing: "0.15em",
              }}
            >
              Book your session →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Arsenal: pinned on desktop, stacked on mobile ─────────── */

function ArsenalPinned() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [idx, setIdx] = useState(0);

  useEffect(
    () =>
      scrollYProgress.on("change", (v) =>
        setIdx(
          Math.min(
            FEATURES.length - 1,
            Math.max(0, Math.floor(v * FEATURES.length)),
          ),
        ),
      ),
    [scrollYProgress],
  );

  const tone = idx % 2 ? "var(--cyan)" : "var(--accent)";
  const f = FEATURES[idx];

  return (
    <div ref={ref} style={{ height: `${FEATURES.length * 90}vh` }}>
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 px-6 lg:grid-cols-[300px_1fr]">
          <ol className="space-y-5">
            {FEATURES.map((item, i) => (
              <li key={item.tag}>
                <button
                  type="button"
                  onClick={() =>
                    ref.current?.parentElement?.scrollTo?.({ top: 0 })
                  }
                  aria-current={i === idx}
                  className="tech-label flex w-full items-center gap-3 text-left transition-all duration-300"
                  style={{
                    color:
                      i === idx
                        ? i % 2
                          ? "var(--cyan)"
                          : "var(--accent)"
                        : "var(--ink-muted)",
                    paddingLeft: i === idx ? 16 : 0,
                    cursor: "default",
                  }}
                >
                  <span style={{ opacity: i === idx ? 1 : 0.35 }}>
                    {item.tag}
                  </span>
                  <span
                    className="h-px flex-1"
                    style={{
                      background: "currentColor",
                      opacity: i === idx ? 1 : 0.25,
                    }}
                  />
                  <span>{item.code}</span>
                </button>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={f.tag}
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <div className="tech-label mb-4" style={{ color: tone }}>
                ※ {f.code}
              </div>
              <h3 className="text-5xl font-bold uppercase leading-[0.9] tracking-tight sm:text-7xl">
                {f.title}
              </h3>
              <p
                className="mt-6 max-w-lg text-lg"
                style={{ color: "var(--ink-soft)" }}
              >
                {f.desc}
              </p>
              <div className="mt-10 h-px w-40" style={{ background: tone }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ArsenalStacked() {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-6 py-20 sm:grid-cols-2">
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.tag}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: i * 0.07 }}
          className="clip-corner relative p-px"
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
                {f.tag} // {f.code}
              </span>
              <span style={{ color: i % 2 ? "var(--cyan)" : "var(--accent)" }}>
                ↗
              </span>
            </div>
            <h3 className="mb-2 text-2xl font-bold">{f.title}</h3>
            <p style={{ color: "var(--ink-soft)" }}>{f.desc}</p>
          </div>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <rect
              className="trace-rect"
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              style={{ "--i": i } as React.CSSProperties}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function LandingPage() {
  const reduce = !!useReducedMotion();
  const isDesktop = useMedia("(min-width: 1024px)");

  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { margin: "-40% 0px 0px 0px" });

  const { scrollYProgress: heroP } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(heroP, [0, 1], [0, reduce ? 0 : -140]);
  const typeY = useTransform(heroP, [0, 1], [0, reduce ? 0 : 110]);
  const gridY = useTransform(heroP, [0, 1], [0, reduce ? 0 : 70]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 110, damping: 20 });
  const smy = useSpring(my, { stiffness: 110, damping: 20 });
  const imgMX = useTransform(smx, (v) => v * (reduce ? 0 : 20));
  const imgMY = useTransform(smy, (v) => v * (reduce ? 0 : 20));

  const ctaRef = useRef<HTMLElement>(null);
  const { scrollYProgress: ctaP } = useScroll({
    target: ctaRef,
    offset: ["start end", "center center"],
  });
  const lockRotate = useTransform(ctaP, [0, 1], [reduce ? 0 : -120, 0]);
  const lockScale = useTransform(ctaP, [0, 1], [reduce ? 1 : 1.9, 1]);

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
    <div className="range-cursor min-h-screen overflow-x-clip">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <ScrollSpine />
      <StickyBook show={!heroInView} />

      <main id="main">
        {/* ── HERO ─────────────────────────────────────────── */}
        <section
          ref={heroRef}
          aria-labelledby="hero-title"
          className="relative overflow-hidden"
          style={{ borderBottom: "1px solid var(--line-strong)" }}
          onMouseMove={(e) => {
            mx.set((e.clientX / window.innerWidth - 0.5) * 2);
            my.set((e.clientY / window.innerHeight - 0.5) * 2);
          }}
        >
          <motion.div
            className="grid-bg absolute inset-0 opacity-[0.22]"
            style={{ y: gridY }}
          />

          <EdgeRail side="left" text="Shooting Range · Unit 001 · Live" />
          <EdgeRail side="right" text="Sec 01 / Hero · TS-00" />

          {/* Ambient rings behind the operator */}
          {!reduce &&
            [560, 440].map((s, i) => (
              <motion.svg
                key={s}
                aria-hidden="true"
                width={s}
                height={s}
                viewBox="0 0 100 100"
                className="pointer-events-none absolute right-[14%] top-1/2 hidden lg:block"
                style={{ marginTop: -s / 2, marginRight: -s / 2, opacity: 0.3 }}
                animate={{ rotate: i ? -360 : 360 }}
                transition={{
                  duration: i ? 30 : 46,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke={i ? "var(--cyan)" : "var(--accent)"}
                  strokeWidth="0.4"
                  strokeDasharray={i ? "1 9" : "3 14"}
                />
              </motion.svg>
            ))}

          <div className="relative mx-auto min-h-[94vh] max-w-[104rem] px-6 pb-16 pt-12">
            {/* Headline — full width, sits UNDER the operator */}
            <motion.h1
              id="hero-title"
              style={{
                y: typeY,
                fontSize: "clamp(3rem, 11.5vw, 10.5rem)",
                lineHeight: 0.8,
              }}
              className="relative z-10 font-bold uppercase tracking-tight lg:absolute lg:left-6 lg:right-6 lg:top-[12%]"
            >
              <span className="block">{headline1}</span>
              <span
                className="block whitespace-nowrap"
                style={{ color: "var(--accent)" }}
              >
                {headline2}
              </span>
            </motion.h1>

            {/* Operator — occludes the type on lg+ */}
            <motion.figure
              style={{ y: imgY }}
              initial={{ opacity: 0, scale: reduce ? 1 : 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.95, ease: EASE }}
              className="relative z-20 mx-auto mt-10 w-[80%] max-w-sm lg:absolute lg:right-[4%] lg:top-[5%] lg:mt-0 lg:h-[88%] lg:w-auto lg:max-w-none"
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -14, 0] }}
                transition={{
                  duration: 7,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                className="relative h-full"
              >
                <motion.div
                  style={{ x: imgMX, y: imgMY }}
                  className="relative h-full"
                >
                  <img
                    src={heroOperator}
                    alt="Illustrated operator in tactical techwear holding an airsoft marker"
                    width={1128}
                    height={1440}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full select-none object-contain"
                  />
                  <CornerBrackets />
                  <div className="absolute right-2 top-2">
                    <motion.div
                      animate={reduce ? undefined : { rotate: 360 }}
                      transition={{
                        duration: 18,
                        ease: "linear",
                        repeat: Infinity,
                      }}
                    >
                      <Reticle size={40} />
                    </motion.div>
                  </div>
                  <div
                    className="tech-label absolute bottom-3 left-0 px-3 py-1.5"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--cyan)",
                      color: "var(--ink)",
                    }}
                  >
                    TS-00 / Operator
                  </div>
                </motion.div>
              </motion.div>
            </motion.figure>

            {/* Copy + CTA */}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
              className="relative z-30 mt-12 max-w-md lg:absolute lg:bottom-[10%] lg:left-6 lg:mt-0"
            >
              <div className="tech-label mb-4" style={{ color: "var(--cyan)" }}>
                ※ Paintball · Airsoft · Indoor Range
              </div>
              <p className="text-lg" style={{ color: "var(--ink-soft)" }}>
                The city's sharpest indoor shooting gallery. Real gear, reactive
                targets, and slots you can book in seconds. Bring your crew.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
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
              </div>
            </motion.div>
          </div>

          <motion.div
            aria-hidden="true"
            className="tech-label absolute bottom-5 left-1/2 -translate-x-1/2"
            style={{ color: "var(--ink-muted)" }}
            animate={reduce ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓ Scroll
          </motion.div>
        </section>

        <Ticker
          items={[
            "Lock in",
            "Take the shot",
            "Book your bay",
            "Bring the crew",
          ]}
          reduce={reduce}
        />

        {/* ── GEAR — helmet breaks out of the frame ────────── */}
        {/* <section
          id="gear"
          aria-labelledby="gear-title"
          className="relative mx-auto max-w-6xl px-6 pb-28 pt-40"
        >
          <HudFrame label="Sec 02 / Gear" code="TS-HELM-M02"> */}
        <section
          id="gear"
          aria-labelledby="gear-title"
          className="mx-auto max-w-6xl px-6 pb-28 pt-44"
        >
          <div className="relative">
            <HudFrame label="Sec 02 / Gear" code="TS-HELM-M02">
              <div className="grid grid-cols-12 gap-8 p-8 sm:p-14">
                <div
                  aria-hidden="true"
                  className="hidden lg:col-span-5 lg:block"
                />
                <motion.div
                  variants={fade}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  className="col-span-12 lg:col-span-7 lg:pt-8"
                >
                  <div
                    className="tech-label mb-3"
                    style={{ color: "var(--accent)" }}
                  >
                    ※ The gear
                  </div>
                  <h2
                    id="gear-title"
                    className="mb-5 text-4xl font-bold uppercase tracking-tight sm:text-6xl"
                  >
                    Suit up, then{" "}
                    <span style={{ color: "var(--accent)" }}>lock on</span>
                  </h2>
                  <p
                    className="mb-10 max-w-md"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Every session includes full protective gear — helmets,
                    masks, and padding rated for indoor play. Walk in with
                    nothing, walk out with a story.
                  </p>
                  <dl className="grid max-w-lg grid-cols-2 gap-x-8 gap-y-5">
                    {GEAR_SPEC.map((s, i) => (
                      <motion.div
                        key={s.k}
                        className="pt-2"
                        style={{
                          borderTop: `1px solid ${i % 2 ? "var(--cyan)" : "var(--line)"}`,
                        }}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
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
                      </motion.div>
                    ))}
                  </dl>
                </motion.div>
              </div>
            </HudFrame>

            {/* Sibling of the frame, so it can overflow the clip */}
            <motion.img
              src={gearHelmet}
              alt="Illustrated full-face range helmet on a display stand"
              width={1128}
              height={1440}
              loading="lazy"
              decoding="async"
              draggable={false}
              initial={{
                opacity: 0,
                y: reduce ? 0 : 60,
                rotate: reduce ? 0 : -4,
              }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="pointer-events-none absolute -top-28 left-[3%] z-20 hidden w-[34%] max-w-xs select-none lg:block"
            />
          </div>
        </section>
        {/* ── ARSENAL — dark chamber, pinned scroll ────────── */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="plate-dark relative"
          style={{
            borderTop: "1px solid var(--line-strong)",
            borderBottom: "1px solid var(--line-strong)",
          }}
        >
          <div className="grid-bg absolute inset-0 opacity-[0.12]" />
          <EdgeRail side="left" text="Sec 03 / Arsenal" />
          <div className="relative mx-auto max-w-6xl px-6 pt-24">
            <div className="tech-label mb-3" style={{ color: "var(--cyan)" }}>
              ※ The arsenal
            </div>
            <h2
              id="features-title"
              className="text-5xl font-bold uppercase tracking-tight sm:text-7xl"
            >
              What you get
            </h2>
          </div>
          {isDesktop && !reduce ? <ArsenalPinned /> : <ArsenalStacked />}
        </section>

        {/* ── SQUAD — image crosses the frame ──────────────── */}
        <section
          aria-labelledby="squad-title"
          className="relative mx-auto max-w-6xl px-6 py-32"
        >
          <HudFrame
            label="Sec 04 / Group play"
            code="SQD-DISC"
            tone="var(--accent)"
          >
            <div className="grid grid-cols-12 gap-8 p-8 sm:p-14">
              <motion.div
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                className="col-span-12 lg:col-span-5"
              >
                <div
                  className="tech-label mb-3"
                  style={{ color: "var(--cyan)" }}
                >
                  ※ Group play
                </div>
                <h2
                  id="squad-title"
                  className="text-5xl font-bold uppercase leading-[0.88] tracking-tight sm:text-6xl"
                >
                  Squad up.
                  <br />
                  <span style={{ color: "var(--accent)" }}>Split the tab.</span>
                </h2>
                <p
                  className="mt-6 max-w-sm"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Bigger crews get bigger discounts. Book together, play
                  together, settle up together.
                </p>
                <Magnetic reduce={reduce}>
                  <Link
                    to="/book"
                    className="clip-corner tech-label mt-9 inline-block px-7 py-3.5 font-bold"
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      letterSpacing: "0.15em",
                    }}
                  >
                    Book for a crew →
                  </Link>
                </Magnetic>
              </motion.div>
              <div
                aria-hidden="true"
                className="hidden lg:col-span-7 lg:block"
              />
            </div>
          </HudFrame>

          <motion.img
            src={duoAction}
            alt="Two illustrated players in techwear back-to-back holding markers"
            width={1512}
            height={1008}
            loading="lazy"
            decoding="async"
            draggable={false}
            initial={{ opacity: 0, x: reduce ? 0 : 70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="pointer-events-none absolute -right-6 bottom-8 z-20 hidden w-[58%] select-none lg:block"
          />
        </section>

        {/* ── AT A GLANCE — one dominant stat, three specs ─── */}
        <section
          aria-label="At a glance"
          style={{
            borderTop: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-end gap-12 px-6 py-24 lg:grid-cols-[1.1fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <div
                className="tech-label mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                {EXPERIENCE[0].k}
              </div>
              <Counter
                to={10}
                suffix="+"
                className="block font-bold leading-none"
                style={{
                  fontSize: "clamp(6rem, 18vw, 15rem)",
                  color: "var(--accent)",
                }}
              />
            </motion.div>

            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1">
              {EXPERIENCE.slice(1).map((e, i) => (
                <motion.div
                  key={e.k}
                  className="pt-3"
                  style={{
                    borderTop: `1px solid ${i === 1 ? "var(--cyan)" : "var(--line)"}`,
                  }}
                  initial={{ opacity: 0, x: reduce ? 0 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.55 }}
                >
                  <dt
                    className="tech-label"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {e.k}
                  </dt>
                  <dd
                    className="text-3xl font-bold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {e.v}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── CTA — reticle locks on as you approach ───────── */}
        <section
          ref={ctaRef}
          aria-labelledby="cta-title"
          className="relative mx-auto max-w-6xl px-6 py-36 text-center"
        >
          <motion.div
            style={{ rotate: lockRotate, scale: lockScale }}
            className="mb-8 flex justify-center"
          >
            <Reticle size={64} />
          </motion.div>
          <motion.h2
            id="cta-title"
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mb-6 text-6xl font-bold uppercase tracking-tight sm:text-8xl"
          >
            Ready to <span style={{ color: "var(--accent)" }}>fire</span>?
          </motion.h2>
          <p
            className="mx-auto mb-10 max-w-md"
            style={{ color: "var(--ink-soft)" }}
          >
            Pick a slot, grab your loadout, and show up. It's that simple.
          </p>
          <Magnetic reduce={reduce}>
            <Link
              to="/book"
              className="clip-corner tech-label inline-block px-12 py-5 font-bold"
              style={{
                background: "var(--accent)",
                color: "#fff",
                letterSpacing: "0.15em",
              }}
            >
              Book now →
            </Link>
          </Magnetic>
          <RegMark className="left-4 top-8" tone="var(--cyan)" />
          <RegMark className="bottom-8 right-4" />
        </section>
      </main>

      {/* <Divider variant="rule" />
      <footer className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <span className="text-3xl font-bold">
            Titan<span style={{ color: "var(--accent)" }}>Shoots</span>
          </span>
          <div
            className="tech-label text-right"
            style={{ color: "var(--ink-muted)" }}
          >
            <div>© TitanShoots · Book responsibly</div>
            <div className="mt-1" style={{ color: "var(--cyan)" }}>
              Unit 001 · Indoor Range
            </div>
          </div>
        </div>
        <div
          className="hatch mt-10 h-3 w-full"
          style={{ color: "var(--line)" }}
        />
      </footer> */}
      <SiteFooter />
    </div>
  );
}
const CONTACT = {
  line1: "V46M+432",
  line2: "Vellore – Thoothukudi Highway",
  line3: "Thuttipattu, Tamil Nadu 632011",
  line4: "India",
  phone: "+91 90805 49234",
  tel: "+919080549234",
  map: "https://www.google.com/maps?q=12.8609146,79.1328481&z=17&hl=en",
  lat: "12.8609",
  lng: "79.1328",
} as const;
function SiteFooter() {
  return (
    <footer
      className="plate-dark relative"
      style={{ borderTop: "1px solid var(--line-strong)" }}
    >
      <div className="hatch h-3 w-full" style={{ color: "var(--accent)" }} />
      <div className="grid-bg absolute inset-0 opacity-[0.08]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="text-4xl font-bold">
              Titan<span style={{ color: "var(--accent)" }}>Shoots</span>
            </span>
            <p className="mt-4 max-w-xs" style={{ color: "var(--ink-soft)" }}>
              Indoor paintball &amp; airsoft shooting gallery. Walk in, gear up,
              take the shot.
            </p>
            <div
              className="tech-label mt-6 flex items-center gap-2"
              style={{ color: "var(--cyan)" }}
            >
              <span
                className="blink inline-block h-2 w-2 rounded-full"
                style={{ background: "var(--cyan)" }}
              />
              Unit 001 · Bookings open
            </div>
          </div>

          <div className="lg:col-span-4">
            <div
              className="tech-label mb-4 pb-2"
              style={{
                color: "var(--ink-muted)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              ※ Location
            </div>
            <address
              className="not-italic leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              <span
                className="block font-bold"
                style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}
              >
                {CONTACT.line1}
              </span>
              {CONTACT.line2}
              <br />
              {CONTACT.line3}
              <br />
              {CONTACT.line4}
            </address>

            <div
              className="tech-label mt-3"
              style={{ color: "var(--ink-muted)" }}
            >
              {CONTACT.lat}° N · {CONTACT.lng}° E
            </div>

            <a
              href={CONTACT.map}
              target="_blank"
              rel="noopener noreferrer"
              className="clip-corner tech-label mt-6 inline-block px-6 py-3"
              style={{ border: "1px solid var(--cyan)", color: "var(--cyan)" }}
            >
              Open in Maps ↗
            </a>
          </div>

          <div className="lg:col-span-4">
            <div
              className="tech-label mb-4 pb-2"
              style={{
                color: "var(--ink-muted)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              ※ Contact
            </div>
            <a
              href={`tel:${CONTACT.tel}`}
              className="block text-2xl font-bold transition-colors sm:text-3xl"
              style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink)")}
            >
              {CONTACT.phone}
            </a>
            <div
              className="tech-label mt-2"
              style={{ color: "var(--ink-muted)" }}
            >
              Tap to call
            </div>

            <nav aria-label="Footer" className="mt-8 flex flex-col gap-3">
              <Link
                to="/book"
                className="tech-label"
                style={{ color: "var(--ink-soft)" }}
              >
                → Book a session
              </Link>
              <a
                href="#gear"
                className="tech-label"
                style={{ color: "var(--ink-soft)" }}
              >
                → The gear
              </a>
              <a
                href="#features"
                className="tech-label"
                style={{ color: "var(--ink-soft)" }}
              >
                → The arsenal
              </a>
            </nav>

            <Magnetic reduce={false}>
              <Link
                to="/book"
                className="clip-corner tech-label mt-8 inline-block px-7 py-3.5 font-bold"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  letterSpacing: "0.15em",
                }}
              >
                Book your session →
              </Link>
            </Magnetic>
          </div>
        </div>

        <div
          className="mt-16 flex flex-wrap items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
            © {new Date().getFullYear()} TitanShoots · Book responsibly
          </span>
          <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
            TS · Unit 001 · IN-TN
          </span>
        </div>

        <RegMark className="-left-1 top-6" />
        <RegMark className="-right-1 bottom-6" tone="var(--cyan)" />
      </div>
    </footer>
  );
}
