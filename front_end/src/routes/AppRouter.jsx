import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPage from "../pages/auth/Login";
import ForgotPasswordPage from "../pages/auth/ForgetPassWord";
import ResetPasswordPage from "../pages/auth/ResetPassWord";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminLivreurs from "../pages/admin/Drivers";
import AdminLivraisons from "../pages/admin/Deliveries";
import AdminHistorique from "../pages/admin/History";
import AdminProfile from "../pages/admin/profil";
import AdminCommandes from "../pages/admin/AdminCommandes";
import AdminCommandeDetail from "../pages/admin/AdminCommandeDetail";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole)
    return <Navigate to="/login" replace />;
  return children;
};

const RoleRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (role === "livreur") return <Navigate to="/livreur/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const A = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<RoleRedirect />} />

        <Route
          path="/admin/dashboard"
          element={
            <A>
              <AdminDashboard />
            </A>
          }
        />
        <Route
          path="/admin/commandes"
          element={
            <A>
              <AdminCommandes />
            </A>
          }
        />
        <Route
          path="/admin/commandes/:id"
          element={
            <A>
              <AdminCommandeDetail />
            </A>
          }
        />
        <Route
          path="/admin/livreurs"
          element={
            <A>
              <AdminLivreurs />
            </A>
          }
        />
        <Route
          path="/admin/livraisons"
          element={
            <A>
              <AdminLivraisons />
            </A>
          }
        />
        <Route
          path="/admin/historique"
          element={
            <A>
              <AdminHistorique />
            </A>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <A>
              <AdminProfile />
            </A>
          }
        />

        <Route
          path="/livreur/*"
          element={
            <ProtectedRoute requiredRole="livreur">
              <div className="p-8 text-center text-gray-400">
                Dashboard Livreur — bientôt 🚀
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
