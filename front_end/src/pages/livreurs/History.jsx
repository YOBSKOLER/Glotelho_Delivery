import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function LivreurHistorique() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/livreur/livraisons/historique");
        setLivraisons(res.data?.livraisons || res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#2563EB] px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/livreur/dashboard")}
          className="p-2 rounded-xl bg-blue-700 text-white"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <p className="text-white font-semibold text-sm">Historique</p>
          <p className="text-blue-200 text-xs">
            {livraisons.length} livraison(s) complétée(s)
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : livraisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm">Aucune livraison complétée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {livraisons.map((liv) => (
              <div
                key={liv.id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {liv.commande?.client_nom || liv.name || "—"}
                  </p>
                  <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700">
                    Livrée
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  📍 {liv.commande?.client_adresse || liv.adresse || "—"}
                </p>
                <p className="text-xs text-gray-400">
                  📅{" "}
                  {liv.updated_at
                    ? new Date(liv.updated_at).toLocaleDateString("fr-FR")
                    : "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
