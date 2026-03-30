import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiClock,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

const menuItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: <FiHome size={18} /> },
  {
    path: "/admin/commandes",
    label: "Commandes & Livraisons",
    icon: <FiPackage size={18} />,
  },
  { path: "/admin/livreurs", label: "Livreurs", icon: <FiUsers size={18} /> },
  {
    path: "/admin/historique",
    label: "Historique",
    icon: <FiClock size={18} />,
  },
  { path: "/admin/profile", label: "Profil", icon: <FiUser size={18} /> },
];

export default function AdminLayout({ children, title, subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        className={`flex items-center justify-center px-4 py-5 border-b border-gray-100 ${collapsed ? "justify-center" : ""}`}
      >
        {collapsed ? (
          <img
            src="/src/assets/images/Favicon.png"
            alt="Glotelho"
            className="w-10 h-10"
          />
        ) : (
          <img
            src="/src/assets/images/logo1.png"
            alt="Glotelho Delivery"
            className="h-18 w-auto"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : ""}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${collapsed ? "justify-center" : ""} ${
                active
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">
                {user?.name || "Admin"}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email || ""}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Déconnexion" : ""}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all w-full ${collapsed ? "justify-center" : ""}`}
        >
          <FiLogOut size={18} />
          {!collapsed && (
            <span className="text-sm font-medium">Déconnexion</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* ── Sidebar desktop ── */}
      <aside
        className={`${collapsed ? "w-[68px]" : "w-60"} bg-white border-r border-gray-100 flex-col transition-all duration-300 flex-shrink-0 hidden lg:flex`}
      >
        <SidebarContent />
      </aside>

      {/* ── Sidebar mobile (overlay) ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-white flex flex-col shadow-2xl">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black bg-opacity-40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bouton menu desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hidden lg:flex"
            >
              <FiMenu size={18} />
            </button>
            {/* Bouton menu mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 lg:hidden"
            >
              {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
            {title && (
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <span className="text-sm text-gray-600 font-medium hidden sm:block">
              {user?.name || "Admin"}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
