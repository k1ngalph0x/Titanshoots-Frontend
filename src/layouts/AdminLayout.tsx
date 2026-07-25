// import { NavLink, Outlet, useNavigate } from "react-router-dom";
// import { useAdminAuth } from "../auth/AdminAuthContext";

// const NAV = [
//   { to: "/admin", label: "Dashboard", end: true },
//   { to: "/admin/pricing", label: "Pricing" },
//   { to: "/admin/bookings", label: "Bookings" },
//   { to: "/admin/analytics", label: "Analytics" },
//   { to: "/admin/audit", label: "Audit log" },
// ];

// export default function AdminLayout() {
//   const { admin, logout } = useAdminAuth();
//   const navigate = useNavigate();

//   async function handleLogout() {
//     await logout();
//     navigate("/admin/login");
//   }

//   return (
//     <div className="min-h-screen flex">
//       <aside
//         className="w-56 shrink-0 flex flex-col"
//         style={{
//           borderRight: "1px solid var(--line)",
//           background: "var(--surface)",
//         }}
//       >
//         <div
//           className="px-5 py-5"
//           style={{ borderBottom: "1px solid var(--line)" }}
//         >
//           <div className="text-xl font-bold">
//             TITAN<span style={{ color: "var(--accent)" }}>ADMIN</span>
//           </div>
//           <div
//             className="tech-label mt-1"
//             style={{ color: "var(--ink-muted)" }}
//           >
//             @{admin?.username}
//           </div>
//         </div>
//         <nav className="flex-1 py-3">
//           {NAV.map((n) => (
//             <NavLink
//               key={n.to}
//               to={n.to}
//               end={n.end}
//               className="block px-5 py-2.5 tech-label transition-colors"
//               style={({ isActive }) => ({
//                 color: isActive ? "var(--accent)" : "var(--ink-soft)",
//                 background: isActive ? "var(--accent-wash)" : "transparent",
//                 borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
//               })}
//             >
//               {n.label}
//             </NavLink>
//           ))}
//         </nav>
//         <button
//           onClick={handleLogout}
//           className="m-4 py-2.5 clip-corner tech-label"
//           style={{ border: "1px solid var(--line)", color: "var(--ink-soft)" }}
//         >
//           Sign out →
//         </button>
//       </aside>

//       <main className="flex-1 min-w-0">
//         <div className="hazard hazard-live h-1.5 w-full" />
//         <div className="p-8">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   );
// }

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
    <div className="flex min-h-screen" style={{ background: "var(--paper)" }}>
      <aside
        className="flex w-60 shrink-0 flex-col"
        style={{
          borderRight: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <div
          className="px-6 py-6"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="text-xl font-bold tracking-tight">
            TITAN<span style={{ color: "var(--accent)" }}>ADMIN</span>
          </div>
          <div
            className="tech-label mt-1.5"
            style={{ color: "var(--ink-muted)" }}
          >
            @{admin?.username}
          </div>
        </div>

        <nav className="flex-1 px-3 py-5">
          <div
            className="mb-2 px-3"
            style={{ color: "var(--ink-muted)", fontSize: 13 }}
          >
            Manage
          </div>

          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className="relative block rounded-sm px-3 py-2.5 text-sm font-medium transition-colors"
              style={({ isActive }) => ({
                color: isActive ? "var(--ink)" : "var(--ink-soft)",
                background: isActive ? "var(--surface-dim)" : "transparent",
              })}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 transition-opacity"
                    style={{
                      background: "var(--accent)",
                      opacity: isActive ? 1 : 0,
                    }}
                  />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-2"
            style={{ color: "var(--ink-muted)", fontSize: 12 }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--success)" }}
            />
            System online
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mx-4 mb-4 rounded-sm py-2.5 text-sm transition-colors"
          style={{ border: "1px solid var(--line)", color: "var(--ink-soft)" }}
        >
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1240px] px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
