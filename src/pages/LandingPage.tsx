import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SiteHeader from "../components/SiteHeader";
import TechFrame from "../components/TechFrame";

const FEATURES = [
  {
    tag: "01",
    title: "Standard Arsenal",
    desc: "A full rack of precision markers for every skill level. Grab a pack of shots and lock in.",
  },
  {
    tag: "02",
    title: "Special Guns",
    desc: "High-spec weapons for the serious shooter. More power, more range, more bragging rights.",
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
];

const EXPERIENCE = [
  { k: "Guns", v: "10+" },
  { k: "Shot packs", v: "30–50" },
  { k: "Book online", v: "UPI" },
  { k: "Group play", v: "Yes" },
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="tech-label mb-4"
            style={{ color: "var(--accent)" }}
          >
            ※ Paintball · Airsoft · Indoor Range
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl sm:text-8xl font-bold tracking-tight leading-[0.95]"
          >
            LOCK IN.
            <br />
            <span style={{ color: "var(--accent)" }}>TAKE THE SHOT.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 max-w-lg text-lg"
            style={{ color: "var(--ink-soft)" }}
          >
            The city's sharpest indoor shooting gallery. Real gear, reactive
            targets, and slots you can book in seconds. Bring your crew.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <Link
              to="/book"
              className="px-8 py-4 clip-corner tech-label font-bold"
              style={{
                background: "var(--accent)",
                color: "#fff",
                letterSpacing: "0.15em",
              }}
            >
              Book your session →
            </Link>
            <a
              href="#features"
              className="px-8 py-4 clip-corner tech-label"
              style={{
                border: "1px solid var(--line-strong)",
                color: "var(--ink)",
              }}
            >
              See what's inside
            </a>
          </motion.div>
        </div>
        <div className="hazard hazard-live h-2 w-full" />
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <div className="tech-label mb-3" style={{ color: "var(--accent)" }}>
          ※ The arsenal
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-10">
          WHAT YOU GET
        </h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-5 sm:grid-cols-2"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.tag} variants={fade}>
              <TechFrame className="p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="tech-label"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {f.tag} //
                  </span>
                  <span style={{ color: "var(--accent)" }}>↗</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{f.title}</h3>
                <p style={{ color: "var(--ink-soft)" }}>{f.desc}</p>
              </TechFrame>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* EXPERIENCE STRIP */}
      <section
        id="experience"
        style={{
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {EXPERIENCE.map((e, i) => (
            <motion.div
              key={e.k}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div
                className="text-4xl font-bold mb-1"
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

      {/* CLOSING CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl font-bold tracking-tight mb-6"
        >
          READY TO <span style={{ color: "var(--accent)" }}>FIRE</span>?
        </motion.h2>
        <p
          className="max-w-md mx-auto mb-8"
          style={{ color: "var(--ink-soft)" }}
        >
          Pick a slot, grab your loadout, and show up. It's that simple.
        </p>
        <Link
          to="/book"
          className="inline-block px-10 py-4 clip-corner tech-label font-bold"
          style={{
            background: "var(--accent)",
            color: "#fff",
            letterSpacing: "0.15em",
          }}
        >
          Book now →
        </Link>
      </section>

      <div className="hazard hazard-live h-2 w-full" />
      <footer className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <span className="text-lg font-bold">
          TITAN<span style={{ color: "var(--accent)" }}>SHOOTS</span>
        </span>
        <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
          © TitanShoots · Book responsibly
        </span>
      </footer>
    </div>
  );
}
