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
  FiAlertCircle,
} from "react-icons/fi";

// ── Config des onglets ────────────────────────────────────────────────────────
// key = valeur du champ `statut` dans la table commandes
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
    key: "reportee",
    label: "Reportées",
    icon: <FiAlertCircle size={14} />,
    cls: "text-purple-600 bg-purple-50 border-purple-200",
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
  en_attente:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  assignee: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  en_livraison:
    "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  reportee:
    "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  livree: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  annulee: "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400",
};

const statutLabel = {
  en_attente: "En attente",
  assignee: "Assignée",
  en_livraison: "En livraison",
  reportee: "Reportée",
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
  const [livreurSearch, setLivreurSearch] = useState("");
  const [datePrevue, setDatePrevue] = useState("");
  const [heurePrevue, setHeurePrevue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        api.get("/admin/commandes"),
        api.get("/admin/livreurs"),
      ]);

      const commandesData = cRes.data?.commandes || cRes.data || [];
      const livreursData = lRes.data?.livreurs || lRes.data || [];

      // Compte les livraisons actives par livreur pour afficher la charge
      const livRes = await api
        .get("/admin/livraisons")
        .catch(() => ({ data: { livraisons: [] } }));
      const livraisons = livRes.data?.livraisons || [];

      const livreursAvecCharge = livreursData.map((l) => ({
        ...l,
        en_cours: livraisons.filter(
          (liv) =>
            liv.livreur_id === l.id &&
            ["assigned", "in_delivery"].includes(liv.status),
        ).length,
      }));

      setCommandes(commandesData);
      setLivreurs(livreursAvecCharge);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  // ── Filtre principal
  // Le filtre compare c.statut (champ commandes) avec la key de l'onglet
  const filtered = commandes.filter((c) => {
    const matchTab = activeTab === "tous" || c.statut === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      c.client_nom?.toLowerCase().includes(q) ||
      c.client_adresse?.toLowerCase().includes(q) ||
      c.client_telephone?.toLowerCase().includes(q) ||
      c.livreur?.name?.toLowerCase().includes(q) ||
      c.source_id?.toLowerCase().includes(q) ||
      String(c.id).includes(q);
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const countTab = (key) =>
    key === "tous"
      ? commandes.length
      : commandes.filter((c) => c.statut === key).length;

  // ── Filtre livreurs dans le modal
  const livreursFiltres = livreurs
    .filter((l) => l.status === "active" || !l.status)
    .filter(
      (l) =>
        !livreurSearch ||
        l.name?.toLowerCase().includes(livreurSearch.toLowerCase()) ||
        l.email?.toLowerCase().includes(livreurSearch.toLowerCase()),
    )
    .sort((a, b) => a.en_cours - b.en_cours);

  const openAssign = (commande) => {
    setSelected(commande);
    setSelectedLivreur("");
    setLivreurSearch("");
    setDatePrevue("");
    setHeurePrevue("");
    setError("");
    setShowModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { livreur_id: selectedLivreur };
      if (datePrevue && heurePrevue) {
        payload.date_livraison_prevue = `${datePrevue}T${heurePrevue}:00`;
      }
      await api.post(`/admin/commandes/${selected.id}/assigner`, payload);
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
                : "text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.key
                  ? "bg-white bg-opacity-60"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
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
          placeholder="Rechercher par nom, téléphone, adresse, livreur, ref. Magento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
              className="h-24 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <FiPackage size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Aucune commande trouvée</p>
          {search && (
            <p className="text-xs mt-1 text-gray-300">
              Essayez une autre recherche
            </p>
          )}
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
              const totalPrix = Array.isArray(c.articles)
                ? c.articles.reduce(
                    (s, a) => s + (a.prix || 0) * (a.qty || 1),
                    0,
                  )
                : 0;
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md dark:hover:bg-gray-700/40 transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/commandes/${c.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] font-bold text-sm flex-shrink-0">
                        {c.client_nom?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {c.client_nom}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-gray-400 font-mono">
                            #{c.id}
                          </p>
                          {c.source_id && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono">
                              {c.source_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
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
                      <span>{totalQty} art.</span>
                    </div>
                    {totalPrix > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                          {totalPrix.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    )}
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

                  {/* Raison report si reportée */}
                  {c.statut === "reportee" && c.livraison?.raison_report && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                      <FiAlertCircle
                        size={12}
                        className="text-purple-500 flex-shrink-0"
                      />
                      <p className="text-xs text-purple-600 dark:text-purple-300">
                        {c.livraison.raison_report}
                      </p>
                      {c.livraison?.date_livraison_prevue && (
                        <span className="ml-auto text-xs text-purple-700 font-semibold flex-shrink-0">
                          {" "}
                          {new Date(
                            c.livraison.date_livraison_prevue,
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                    {c.livreur ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] text-xs font-bold flex-shrink-0">
                          {c.livreur.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {c.livreur.name}
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
                Page {page}/{totalPages} — {filtered.length} résultat(s)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-40"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal assignation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Assigner un livreur
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Infos commande */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Commande #{selected?.id}
                </p>
                {selected?.source_id && (
                  <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                    {selected.source_id}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {selected?.client_nom}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {selected?.client_adresse}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-4">
              {/* Recherche livreur */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Choisir un livreur
                </label>
                <div className="relative mb-2">
                  <FiSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={13}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={livreurSearch}
                    onChange={(e) => setLivreurSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {livreursFiltres.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">
                      Aucun livreur trouvé
                    </p>
                  ) : (
                    livreursFiltres.map((l) => (
                      <label
                        key={l.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          selectedLivreur == l.id
                            ? "border-[#2563EB] bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            selectedLivreur == l.id
                              ? "bg-[#2563EB] text-white"
                              : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {l.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {l.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {l.email}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-lg font-medium flex-shrink-0 ${
                            l.en_cours === 0
                              ? "bg-green-50 text-green-600"
                              : l.en_cours <= 2
                                ? "bg-yellow-50 text-yellow-600"
                                : "bg-red-50 text-red-500"
                          }`}
                        >
                          {l.en_cours} en cours
                        </span>
                        {selectedLivreur == l.id && (
                          <FiCheckCircle
                            className="text-[#2563EB] flex-shrink-0"
                            size={14}
                          />
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Date et heure */}
              <div className="border-t border-gray-100 dark:border-gray-600 pt-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Planifier{" "}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={datePrevue}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDatePrevue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Heure
                    </label>
                    <input
                      type="time"
                      value={heurePrevue}
                      onChange={(e) => setHeurePrevue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
                {datePrevue && heurePrevue && (
                  <p className="text-xs text-[#2563EB] mt-1.5">
                    {" "}
                    {new Date(`${datePrevue}T${heurePrevue}`).toLocaleString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedLivreur || saving}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiTruck size={14} />
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
