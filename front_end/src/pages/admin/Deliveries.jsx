import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiInbox } from "react-icons/fi";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const statusConfig = {
  pending: {
    label: "En attente",
    cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300",
  },
  assigned: {
    label: "Assignée",
    cls: "bg-blue-50 text-blue-700 dark:bg-blue-800 dark:text-blue-300",
  },
  in_delivery: {
    label: "En livraison",
    cls: "bg-orange-50 text-orange-700 dark:bg-orange-800 dark:text-orange-300",
  },
  delivered: {
    label: "Livrée",
    cls: "bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-300",
  },
};

export default function AdminLivraisons() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const lRes = await api.get("/admin/livraisons");
      setLivraisons(lRes.data?.livraisons || lRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <AdminLayout
      title="Livraisons"
      subtitle={`${livraisons.length} livraison(s) au total`}
    >
      <div className="rounded-2xl border overflow-hidden bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700">
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
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-400">
            <FiInbox size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Aucune livraison trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider dark:bg-gray-900 dark:text-gray-400">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Adresse</th>
                  <th className="text-left px-6 py-3">Livreur</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {livraisons.map((liv) => {
                  const st = statusConfig[liv.status] || {
                    label: liv.status,
                    cls: "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                  };
                  return (
                    <tr
                      key={liv.id}
                      onClick={() => navigate(`/admin/livraisons/${liv.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-xs font-mono text-gray-400 dark:text-gray-400">
                        #{liv.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {liv.commande?.client_nom || liv.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                        {liv.commande?.client_adresse || liv.adresse || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {liv.livreur?.name || (
                          <span className="text-gray-300 dark:text-gray-500 italic text-xs">
                            Non assigné
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 dark:text-gray-400">
                        {liv.created_at
                          ? new Date(liv.created_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
