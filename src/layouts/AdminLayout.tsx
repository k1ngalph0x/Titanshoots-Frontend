import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/pricing", label: "Pricing" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/audit", label: "Audit log" },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside
        className="w-56 shrink-0 flex flex-col"
        style={{
          borderRight: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="text-xl font-bold">
            TITAN<span style={{ color: "var(--accent)" }}>ADMIN</span>
          </div>
          <div
            className="tech-label mt-1"
            style={{ color: "var(--ink-muted)" }}
          >
            @{admin?.username}
          </div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className="block px-5 py-2.5 tech-label transition-colors"
              style={({ isActive }) => ({
                color: isActive ? "var(--accent)" : "var(--ink-soft)",
                background: isActive ? "var(--accent-wash)" : "transparent",
                borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
              })}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 py-2.5 clip-corner tech-label"
          style={{ border: "1px solid var(--line)", color: "var(--ink-soft)" }}
        >
          Sign out →
        </button>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="hazard hazard-live h-1.5 w-full" />
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
