import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import TechFrame from "../../components/TechFrame";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username, password);
      navigate("/admin");
    } catch (err: any) {
      setError(
        err?.response?.status === 429
          ? "Too many attempts. Wait a few minutes."
          : "Invalid username or password.",
      );
    } finally {
      setBusy(false);
    }
  }

  const input = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    padding: "0.7rem 0.9rem",
    width: "100%",
    fontFamily: "var(--font-display)",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="hazard h-2 w-full mb-6 clip-corner" />
        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl font-bold tracking-tight mb-1"
        >
          ADMIN <span style={{ color: "var(--accent)" }}>TERMINAL</span>
        </motion.h1>
        <p className="tech-label mb-6" style={{ color: "var(--ink-muted)" }}>
          Authorized personnel only
        </p>

        <TechFrame className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                className="tech-label block mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                Username
              </label>
              <input
                style={input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label
                className="tech-label block mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                Password
              </label>
              <input
                style={input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="tech-label" style={{ color: "var(--danger)" }}>
                ⚠ {error}
              </div>
            )}
            <motion.button
              type="submit"
              disabled={busy || !username || !password}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 clip-corner tech-label font-bold"
              style={{
                background:
                  busy || !username || !password
                    ? "var(--surface-dim)"
                    : "var(--accent)",
                color:
                  busy || !username || !password ? "var(--ink-muted)" : "#fff",
                letterSpacing: "0.15em",
                cursor:
                  busy || !username || !password ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "◆ Authenticating…" : "Sign in →"}
            </motion.button>
          </form>
        </TechFrame>
      </div>
    </div>
  );
}
