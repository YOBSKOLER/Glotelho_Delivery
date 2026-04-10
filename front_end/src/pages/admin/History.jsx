import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import { FiTruck, FiStar } from "react-icons/fi";

export default function AdminHistorique() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/historique");
        setLivraisons(res.data?.livraisons || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminLayout title="Historique" subtitle="Livraisons complétées">
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-50 dark:bg-gray-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : livraisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FiTruck size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Aucune livraison complétée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Ref.</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Livreur</th>
                  <th className="text-left px-6 py-3">Note</th>
                  <th className="text-left px-6 py-3">Preuve</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {livraisons.map((liv) => (
                  <tr
                    key={liv.id}
                    onClick={() => navigate(`/admin/livraisons/${liv.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {liv.commande?.source_id || `#${liv.id}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-100">
                      {liv.commande?.client_nom || liv.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {liv.livreur?.name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {liv.note_client ? (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <FiStar
                              key={i}
                              size={12}
                              className={
                                i <= liv.note_client
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-200"
                              }
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {liv.note_client}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-500">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {liv.preuve_photo && (
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-lg">
                            📸
                          </span>
                        )}
                        {liv.preuve_signature && (
                          <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 px-2 py-0.5 rounded-lg">
                            ✍️
                          </span>
                        )}
                        {!liv.preuve_photo && !liv.preuve_signature && (
                          <span className="text-xs text-gray-300 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {liv.updated_at
                        ? new Date(liv.updated_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        Livrée
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
