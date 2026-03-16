import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

export default function AdminHistorique() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/livraisons");
        const all = res.data?.livraisons || res.data || [];
        setLivraisons(all.filter((l) => l.status === "delivered"));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminLayout title="Historique" subtitle="Livraisons complétées">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : livraisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="mb-3 opacity-40"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">Aucune livraison complétée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Livreur</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {livraisons.map((liv) => (
                  <tr
                    key={liv.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      #{liv.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {liv.client_name || liv.user?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {liv.livreur?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {liv.updated_at
                        ? new Date(liv.updated_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700">
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
