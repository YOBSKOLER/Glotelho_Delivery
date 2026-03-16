import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const statutConfig = {
  en_attente: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assignee: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  en_livraison: { label: "En livraison", cls: "bg-orange-50 text-orange-700" },
  livree: { label: "Livrée", cls: "bg-green-50 text-green-700" },
  annulee: { label: "Annulée", cls: "bg-red-50 text-red-500" },
};

export default function AdminCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/commandes");
        setCommandes(res.data?.commandes || res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = commandes.filter((c) => {
    const matchSearch =
      c.client_nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_adresse?.toLowerCase().includes(search.toLowerCase());
    const matchFiltre = filtre === "tous" || c.statut === filtre;
    return matchSearch && matchFiltre;
  });

  return (
    <AdminLayout
      title="Commandes"
      subtitle={`${commandes.length} commande(s) reçues`}
    >
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un client ou une adresse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
          />
        </div>
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
        >
          <option value="tous">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="assignee">Assignée</option>
          <option value="en_livraison">En livraison</option>
          <option value="livree">Livrée</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>

      {/* Table */}
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
        ) : filtered.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Téléphone</th>
                  <th className="text-left px-6 py-3">Adresse</th>
                  <th className="text-left px-6 py-3">Articles</th>
                  <th className="text-left px-6 py-3">Fragile</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => {
                  const st = statutConfig[c.statut] || {
                    label: c.statut,
                    cls: "bg-gray-50 text-gray-600",
                  };
                  const isFragile =
                    Array.isArray(c.articles) &&
                    c.articles.some((a) => a.fragile);
                  const totalQty = Array.isArray(c.articles)
                    ? c.articles.reduce((s, a) => s + (a.qty || 0), 0)
                    : 0;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/commandes/${c.id}`)}
                    >
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        #{c.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {c.client_nom}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.client_telephone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[160px] truncate">
                        {c.client_adresse}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {totalQty} article(s)
                      </td>
                      <td className="px-6 py-4">
                        {isFragile ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-600">
                            ⚠ Fragile
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.statut === "en_attente" && (
                          <button
                            onClick={() => navigate(`/admin/commandes/${c.id}`)}
                            className="flex items-center gap-1.5 text-xs text-white bg-[#2563EB] px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                          >
                            Assigner
                          </button>
                        )}
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
