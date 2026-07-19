import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlansPage from "./pages/PlansPage";
//import SlotsPage from "./pages/SlotsPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import { AdminAuthProvider } from "./auth/AdminAuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPricingPage from "./pages/admin/AdminPricingPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminAuditPage from "./pages/admin/AdminAuditPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import LandingPage from "./pages/LandingPage";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="pricing" element={<AdminPricingPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book" element={<PlansPage />} />
        {/* <Route path="/book/:categoryId/:planId" element={<SlotsPage />} /> */}
        {/* <Route path="/checkout/:sessionId/:planId" element={<CheckoutPage />} /> */}
        <Route path="/checkout/:planId" element={<CheckoutPage />} />
        <Route path="/ticket/:token" element={<ConfirmationPage />} />
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <AdminRoutes />
            </AdminAuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
