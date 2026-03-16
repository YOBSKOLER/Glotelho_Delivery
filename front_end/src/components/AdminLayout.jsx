import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    path: "/admin/commandes",
    label: "Commandes",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    path: "/admin/livreurs",
    label: "Livreurs",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    path: "/admin/livraisons",
    label: "Livraisons",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
        />
      </svg>
    ),
  },
  {
    path: "/admin/historique",
    label: "Historique",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    path: "/admin/profile",
    label: "Profil",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export default function AdminLayout({ children, title, subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside
        className={`${collapsed ? "w-[68px]" : "w-60"} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 flex-shrink-0`}
      >
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
              src="/src/assets/images/logo.png"
              alt="Glotelho Delivery"
              className="h-18 w-auto"
            />
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-60"></span>
                )}
              </Link>
            );
          })}
        </nav>

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
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {!collapsed && (
              <span className="text-sm font-medium">Déconnexion</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {title && (
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-gray-400">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <span className="text-sm text-gray-600 font-medium hidden sm:block">
              {user?.name || "Admin"}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
