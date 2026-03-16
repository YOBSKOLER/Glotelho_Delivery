import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const statusConfig = {
  pending: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En livraison", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
};

function StatCard({ label, value, icon, iconBg, iconColor, loading }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
        {loading ? (
          <div className="w-10 h-6 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
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
      iconBg: "bg-blue-50",
      iconColor: "text-[#2563EB]",
      icon: (
        <svg
          width="22"
          height="22"
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
      label: "Livraisons actives",
      value: stats.active,
      iconBg: "bg-orange-50",
      iconColor: "text-[#F59E0B]",
      icon: (
        <svg
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      label: "Livraisons complétées",
      value: stats.completed,
      iconBg: "bg-green-50",
      iconColor: "text-[#10B981]",
      icon: (
        <svg
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Total livreurs",
      value: stats.drivers,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      icon: (
        <svg
          width="22"
          height="22"
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
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Vue d'ensemble de vos livraisons">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} loading={loading} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">
            Livraisons récentes
          </h2>
          <a
            href="/admin/livraisons"
            className="text-xs text-[#2563EB] hover:underline font-medium"
          >
            Voir tout →
          </a>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : livraisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm">Aucune livraison pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Adresse</th>
                  <th className="text-left px-6 py-3">Livreur</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {livraisons.map((liv) => {
                  const st = statusConfig[liv.status] || {
                    label: liv.status,
                    cls: "bg-gray-50 text-gray-600",
                  };
                  return (
                    <tr
                      key={liv.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-xs font-mono text-gray-400">
                        #{liv.id}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-gray-800">
                        {liv.client_name || liv.user?.name || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 max-w-[180px] truncate">
                        {liv.adresse_arrivee || liv.address || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">
                        {liv.livreur?.name || (
                          <span className="text-gray-300 italic text-xs">
                            Non assigné
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-400">
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
