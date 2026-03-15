import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/auth/Login";
import ForgetPassWord from "../pages/auth/ForgetPassWord";
import ResetPassWord from "../pages/auth/ResetPassWord";

// Route protégée générique
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole)
    return <Navigate to="/login" replace />;
  return children;
};

// Redirection selon le rôle après login
const RoleRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (role === "livreur") return <Navigate to="/livreur/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgetPassWord />} />
        <Route path="/reset-password" element={<ResetPassWord />} />

        {/* Redirection racine */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin routes (à compléter plus tard) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <div className="p-8 text-center text-gray-500">
                Dashboard Admin — à construire prochainement 🚀
              </div>
            </ProtectedRoute>
          }
        />

        {/* Livreur routes (à compléter plus tard) */}
        <Route
          path="/livreur/*"
          element={
            <ProtectedRoute requiredRole="livreur">
              <div className="p-8 text-center text-gray-500">
                Dashboard Livreur — à construire prochainement 🚀
              </div>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
