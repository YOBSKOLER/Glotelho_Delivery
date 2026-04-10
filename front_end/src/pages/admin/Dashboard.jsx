import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPackage, FiTruck, FiCheckCircle, FiUser } from "react-icons/fi";
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

function StatCard({ label, value, icon, iconBg, iconColor, loading }) {
  return (
    <div
      className={`flex items-center gap-4 p-5 rounded-2xl border bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700`}
    >
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-xl ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-medium mb-1 text-gray-400 dark:text-gray-400">
          {label}
        </p>
        {loading ? (
          <div className="w-10 h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    drivers: 0,
  });
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [lRes, dRes] = await Promise.all([
          api.get("/admin/livraisons"),
          api.get("/admin/livreurs"),
        ]);
        const all = lRes.data?.livraisons || lRes.data || [];
        const driv = dRes.data?.livreurs || dRes.data || [];
        setStats({
          total: all.length,
          active: all.filter((l) =>
            ["in_delivery", "assigned"].includes(l.status),
          ).length,
          completed: all.filter((l) => l.status === "delivered").length,
          drivers: driv.length,
        });
        setLivraisons(all.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      label: "Total livraisons",
      value: stats.total,
      iconBg: "bg-blue-50 dark:bg-blue-800",
      iconColor: "text-blue-600 dark:text-blue-300",
      icon: <FiPackage size={22} />,
    },
    {
      label: "Livraisons actives",
      value: stats.active,
      iconBg: "bg-orange-50 dark:bg-orange-800",
      iconColor: "text-orange-500 dark:text-orange-300",
      icon: <FiTruck size={22} />,
    },
    {
      label: "Livraisons complétées",
      value: stats.completed,
      iconBg: "bg-green-50 dark:bg-green-800",
      iconColor: "text-green-500 dark:text-green-300",
      icon: <FiCheckCircle size={22} />,
    },
    {
      label: "Total livreurs",
      value: stats.drivers,
      iconBg: "bg-purple-50 dark:bg-purple-800",
      iconColor: "text-purple-600 dark:text-purple-300",
      icon: <FiUser size={22} />,
    },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Vue d'ensemble des livraisons">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 ">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} loading={loading} />
        ))}
      </div>

      {/* Tableau Livraisons */}
      <div className="rounded-2xl border overflow-hidden bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Livraisons récentes
          </h2>
          <a
            href="/admin/livraisons"
            className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
          >
            Voir tout →
          </a>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-50 dark:bg-gray-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : livraisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-400">
            <p className="text-sm">Aucune livraison pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider dark:bg-gray-900 dark:text-gray-400">
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Client</th>
                  <th className="px-6 py-3 text-left">Adresse</th>
                  <th className="px-6 py-3 text-left">Livreur</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-left">Date</th>
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
                      className="transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
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
