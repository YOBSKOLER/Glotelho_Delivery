import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  FiSun,
  FiMoon,
  FiAlertCircle,
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

// Clé SÉPARÉE pour admin
const DARK_KEY = "adminDark";

export default function AdminLayout({ children, title, subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(DARK_KEY) === "true";
    if (saved) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return saved;
  });

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem(DARK_KEY, next);
  };

  const D = {
    sidebar: dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200",
    main: dark ? "bg-gray-950" : "bg-[#F8FAFC]",
    text: dark ? "text-gray-100" : "text-gray-800",
    sub: dark ? "text-gray-400" : "text-gray-500",
    hover: dark
      ? "hover:bg-gray-800 hover:text-white"
      : "hover:bg-gray-100 hover:text-gray-800",
    card: dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
    thead: dark ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-400",
    row: dark
      ? "divide-gray-700 hover:bg-gray-700"
      : "divide-gray-50 hover:bg-gray-50",
    input: dark
      ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
      : "bg-white border-gray-200 text-gray-800",
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center justify-center px-4 py-4 border-b ${dark ? "border-gray-700" : "border-gray-200"}`}
      >
        {collapsed ? (
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center text-white font-bold text-sm">
            G
          </div>
        ) : (
          <img
            src="/src/assets/images/logo1.png"
            alt="Glotelho"
            className="h-12 w-auto object-contain"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : ""}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${collapsed ? "justify-center" : ""} ${
                active
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : `${D.sub} ${D.hover}`
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Dark toggle */}
      <div className={`px-3 pb-2`}>
        <button
          onClick={toggleDark}
          title={collapsed ? (dark ? "Mode clair" : "Mode sombre") : ""}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium ${D.sub} ${D.hover} ${collapsed ? "justify-center" : ""}`}
        >
          {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
          {!collapsed && <span>{dark ? "Mode clair" : "Mode sombre"}</span>}
        </button>
      </div>

      {/* User + Logout */}
      <div
        className={`px-3 py-3 border-t ${dark ? "border-gray-700" : "border-gray-200"}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${D.text}`}>
                {user?.name}
              </p>
              <p className={`text-xs truncate ${D.sub}`}>{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title={collapsed ? "Déconnexion" : ""}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm font-medium ${collapsed ? "justify-center" : ""}`}
        >
          <FiLogOut size={18} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden ${D.main}`}>
      {/* Sidebar desktop */}
      <aside
        className={`${collapsed ? "w-[68px]" : "w-60"} ${D.sidebar} border-r flex-shrink-0 hidden lg:flex flex-col transition-all duration-300`}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className={`w-64 ${D.sidebar} border-r flex-shrink-0 flex flex-col`}
          >
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black bg-opacity-40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header
          className={`${D.sidebar} border-b px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-xl ${D.hover} ${D.sub} hidden lg:flex`}
            >
              <FiMenu size={18} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`p-2 rounded-xl ${D.hover} ${D.sub} lg:hidden`}
            >
              {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
            {title && (
              <div>
                <h1 className={`text-sm sm:text-base font-semibold ${D.text}`}>
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-xs hidden sm:block ${D.sub}`}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className={`p-2 rounded-xl ${D.hover} ${D.sub}`}
            >
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${D.text}`}>
              {user?.name}
            </span>
          </div>
        </header>
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${D.text}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
