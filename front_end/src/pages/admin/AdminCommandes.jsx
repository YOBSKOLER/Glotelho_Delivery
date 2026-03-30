import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiX,
} from "react-icons/fi";

const tabs = [
  {
    key: "en_attente",
    label: "En attente",
    icon: <FiClock size={14} />,
    cls: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  {
    key: "assignee",
    label: "Assignées",
    icon: <FiUser size={14} />,
    cls: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    key: "en_livraison",
    label: "En livraison",
    icon: <FiTruck size={14} />,
    cls: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    key: "livree",
    label: "Livrées",
    icon: <FiCheckCircle size={14} />,
    cls: "text-green-600 bg-green-50 border-green-200",
  },
  {
    key: "tous",
    label: "Toutes",
    icon: <FiPackage size={14} />,
    cls: "text-gray-600 bg-gray-50 border-gray-200",
  },
];

const statutBadge = {
  en_attente: "bg-yellow-50 text-yellow-700",
  assignee: "bg-blue-50 text-blue-700",
  en_livraison: "bg-orange-50 text-orange-700",
  livree: "bg-green-50 text-green-700",
  annulee: "bg-red-50 text-red-500",
};

const statutLabel = {
  en_attente: "En attente",
  assignee: "Assignée",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

const PAGE_SIZE = 10;

export default function AdminCommandesLivraisons() {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("en_attente");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedLivreur, setSelectedLivreur] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        api.get("/admin/commandes"),
        api.get("/admin/livreurs"),
      ]);
      setCommandes(cRes.data?.commandes || cRes.data || []);
      setLivreurs(lRes.data?.livreurs || lRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Réinitialise la page quand on change d'onglet ou de recherche
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const filtered = commandes.filter((c) => {
    const matchTab = activeTab === "tous" || c.statut === activeTab;
    const matchSearch =
      !search ||
      c.client_nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_adresse?.toLowerCase().includes(search.toLowerCase()) ||
      c.livreur?.name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Pagination côté frontend
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const countTab = (key) =>
    key === "tous"
      ? commandes.length
      : commandes.filter((c) => c.statut === key).length;

  const openAssign = (commande) => {
    setSelected(commande);
    setSelectedLivreur("");
    setError("");
    setShowModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/admin/commandes/${selected.id}/assigner`, {
        livreur_id: selectedLivreur,
      });
      await fetchData();
      setShowModal(false);
      setActiveTab("assignee");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'assignation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Commandes & Livraisons"
      subtitle={`${commandes.length} commande(s) au total`}
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === tab.key
                ? tab.cls + " shadow-sm"
                : "text-gray-400 bg-white border-gray-100 hover:border-gray-200"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? "bg-white bg-opacity-60" : "bg-gray-100"}`}
            >
              {countTab(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative mb-5">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Rechercher un client, une adresse, un livreur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <FiPackage size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Aucune commande trouvée</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((c) => {
              const isFragile =
                Array.isArray(c.articles) && c.articles.some((a) => a.fragile);
              const totalQty = Array.isArray(c.articles)
                ? c.articles.reduce((s, a) => s + (a.qty || 0), 0)
                : 0;
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/commandes/${c.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] font-bold text-sm flex-shrink-0">
                        {c.client_nom?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {c.client_nom}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          #{c.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFragile && (
                        <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-500 rounded-lg font-medium border border-orange-100">
                          ⚠ Fragile
                        </span>
                      )}
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${statutBadge[c.statut] || "bg-gray-50 text-gray-600"}`}
                      >
                        {statutLabel[c.statut] || c.statut}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <FiMapPin
                        size={12}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span className="truncate">{c.client_adresse}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiPackage
                        size={12}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span>{totalQty} article(s)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiCalendar
                        size={12}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    {c.livreur ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] text-xs font-bold flex-shrink-0">
                          {c.livreur.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium text-gray-800">
                            {c.livreur.name}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Aucun livreur assigné
                      </p>
                    )}
                    {c.statut === "en_attente" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssign(c);
                        }}
                        className="flex items-center gap-1.5 text-xs text-white bg-[#2563EB] hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
                      >
                        <FiUser size={12} /> Assigner
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-gray-400">
                Page {page} sur {totalPages} — {filtered.length} résultat(s)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-xs bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                Assigner un livreur
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">
                Commande #{selected?.id}
              </p>
              <p className="text-sm font-medium text-gray-800">
                {selected?.client_nom}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selected?.client_adresse}
              </p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Choisir un livreur
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {livreurs
                    .filter((l) => l.status === "active" || !l.status)
                    .map((l) => (
                      <label
                        key={l.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedLivreur == l.id ? "border-[#2563EB] bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}
                      >
                        <input
                          type="radio"
                          name="livreur"
                          value={l.id}
                          checked={selectedLivreur == l.id}
                          onChange={() => setSelectedLivreur(l.id)}
                          className="hidden"
                        />
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedLivreur == l.id ? "bg-[#2563EB] text-white" : "bg-gray-100 text-gray-600"}`}
                        >
                          {l.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {l.name}
                          </p>
                          <p className="text-xs text-gray-400">{l.email}</p>
                        </div>
                        {selectedLivreur == l.id && (
                          <FiCheckCircle
                            className="ml-auto text-[#2563EB]"
                            size={16}
                          />
                        )}
                      </label>
                    ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedLivreur || saving}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {saving ? "Assignation..." : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
