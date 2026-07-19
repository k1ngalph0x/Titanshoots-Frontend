import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

export default function ProtectedRoute() {
  const { admin, loading } = useAdminAuth();
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center tech-label blink"
        style={{ color: "var(--accent)" }}
      >
        ◆ Verifying session…
      </div>
    );
  }
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
