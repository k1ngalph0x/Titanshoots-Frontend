import { Link } from "react-router-dom";
import { Divider } from "./Divider";

export default function SiteHeader() {
  return (
    <>
      <Divider variant="status" />
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <Link to="/" className="text-xl font-bold tracking-tight">
          TITAN<span style={{ color: "var(--accent)" }}>SHOOTS</span>
        </Link>
        <nav className="flex items-center gap-6">
          <a
            href="/#features"
            className="tech-label"
            style={{ color: "var(--ink-soft)" }}
          >
            Features
          </a>
          <a
            href="/#experience"
            className="tech-label"
            style={{ color: "var(--ink-soft)" }}
          >
            Experience
          </a>
          <Link
            to="/book"
            className="px-5 py-2 clip-corner tech-label font-bold"
            style={{
              background: "var(--accent)",
              color: "#fff",
              letterSpacing: "0.1em",
            }}
          >
            Book now →
          </Link>
        </nav>
      </header>
    </>
  );
}
