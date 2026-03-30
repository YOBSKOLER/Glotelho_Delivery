import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiPackage, FiX } from "react-icons/fi";
import api from "../services/api";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [commandes, setCommandes] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const panelRef = useRef(null);
  const [enLivraison, setEnLivraison] = useState(0); // en cours

  // ── Polling toutes les 30 secondes ───────────────────────────────────────
  const fetchCount = async () => {
    try {
      const res = await api.get("/admin/notifications");
      setCount(res.data.total || 0);
      setEnLivraison(res.data.en_livraison || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommandes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/notifications/commandes");
      setCommandes(res.data?.commandes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Ferme le panel si clic en dehors
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchCommandes();
  };

  const handleGoToCommande = (id) => {
    setOpen(false);
    navigate(`/admin/commandes/${id}`);
  };

  const handleGoToAll = () => {
    setOpen(false);
    navigate("/admin/commandes");
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bouton cloche ── */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
      >
        <FiBell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* ── Panel notifications ── */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifications
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Compteurs */}
          <div className="grid grid-cols-2 gap-3 p-3 border-b border-gray-50">
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-yellow-700">{count}</p>
              <p className="text-xs text-yellow-600 mt-0.5">En attente</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-orange-700">{enLivraison}</p>
              <p className="text-xs text-orange-600 mt-0.5">En livraison</p>
            </div>
          </div>

          {/* Liste commandes récentes */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : commandes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <FiPackage size={28} className="mb-2 opacity-30" />
                <p className="text-xs">Aucune commande en attente</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {commandes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleGoToCommande(c.id)}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-[#2563EB]">
                        {c.client_nom}
                      </p>
                      <span className="text-xs text-gray-400">#{c.id}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {c.client_adresse}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(c.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={handleGoToAll}
              className="w-full text-center text-xs text-[#2563EB] font-medium hover:underline"
            >
              Voir toutes les commandes →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
