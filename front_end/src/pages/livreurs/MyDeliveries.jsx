import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import livreurService from "../../services/livreurService";

const statusConfig = {
  pending: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En cours", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
};

export default function LivreurMesLivraisons() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await livreurService.getMesLivraisons();
        setLivraisons(data);
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
          <p className="text-white font-semibold text-sm">Mes livraisons</p>
          <p className="text-blue-200 text-xs">
            {livraisons.length} livraison(s) assignée(s)
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : livraisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-sm font-medium">Aucune livraison assignée</p>
            <p className="text-xs mt-1 text-gray-300">Revenez plus tard</p>
          </div>
        ) : (
          <div className="space-y-3">
            {livraisons.map((liv, i) => {
              const st = statusConfig[liv.status] || {
                label: liv.status,
                cls: "bg-gray-50 text-gray-600",
              };
              return (
                <div
                  key={liv.id}
                  onClick={() => navigate(`/livreur/livraisons/${liv.id}`)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {liv.commande?.client_nom || liv.name || "—"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 ml-9 mb-3">
                    📍 {liv.commande?.client_adresse || liv.adresse || "—"}
                  </p>

                  <div className="flex items-center justify-between ml-9">
                    <p className="text-xs text-gray-400">
                      📅{" "}
                      {liv.date_livraison
                        ? new Date(liv.date_livraison).toLocaleDateString(
                            "fr-FR",
                          )
                        : "—"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-[#2563EB] font-medium">
                      Voir détails
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
