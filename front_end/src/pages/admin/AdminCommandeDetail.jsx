import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import {
  FiArrowLeft,
  FiUser,
  FiMapPin,
  FiPhone,
  FiPackage,
  FiCheckCircle,
  FiX,
  FiSearch,
  FiTruck,
  FiClock,
} from "react-icons/fi";

const statutConfig = {
  en_attente: {
    label: "En attente",
    cls: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  },
  assignee: {
    label: "Assignée",
    cls: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  },
  en_livraison: {
    label: "En livraison",
    cls: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  },
  reportee: {
    label: "Reportée",
    cls: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  },
  livree: {
    label: "Livrée",
    cls: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  },
  annulee: {
    label: "Annulée",
    cls: "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300",
  },
};

export default function AdminCommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [commande, setCommande] = useState(null);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLivreur, setSelected] = useState("");
  const [livreurSearch, setLivreurSearch] = useState("");
  const [datePrevue, setDatePrevue] = useState("");
  const [heurePrevue, setHeurePrevue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        api.get(`/admin/commandes/${id}`),
        api.get("/admin/livreurs"),
      ]);
      setCommande(cRes.data?.commande || cRes.data);
      setLivreurs(lRes.data?.livreurs || lRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAssigner = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { livreur_id: selectedLivreur };
      if (datePrevue && heurePrevue)
        payload.date_livraison_prevue = `${datePrevue}T${heurePrevue}:00`;
      const res = await api.post(`/admin/commandes/${id}/assigner`, payload);
      setCommande(res.data.commande || res.data);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <AdminLayout title="Détail commande">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </AdminLayout>
    );

  if (!commande)
    return (
      <AdminLayout title="Détail commande">
        <p className="text-gray-400 text-sm">Commande introuvable.</p>
      </AdminLayout>
    );

  const st = statutConfig[commande.statut] || {
    label: commande.statut,
    cls: "bg-gray-50 text-gray-600",
  };
  const articles = Array.isArray(commande.articles) ? commande.articles : [];
  const isFragile = articles.some((a) => a.fragile);
  const totalPrix = articles.reduce(
    (s, a) => s + (a.prix || 0) * (a.qty || 1),
    0,
  );

  const livreursFiltres = livreurs
    .filter((l) => l.status === "active" || !l.status)
    .filter(
      (l) =>
        !livreurSearch ||
        l.name?.toLowerCase().includes(livreurSearch.toLowerCase()) ||
        l.email?.toLowerCase().includes(livreurSearch.toLowerCase()),
    );

  return (
    <AdminLayout title={`Commande #${commande.id}`} subtitle="Détails">
      <button
        onClick={() => navigate("/admin/commandes")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mb-5 transition"
      >
        <FiArrowLeft size={16} /> Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Infos client */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Informations client
              </h2>
              <span
                className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}
              >
                {st.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <FiUser size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Nom</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {commande.client_nom}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FiPhone size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Téléphone</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {commande.client_telephone || "—"}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2">
                <FiMapPin size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Adresse</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {commande.client_adresse}
                  </p>
                  {commande.latitude && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {commande.latitude}, {commande.longitude}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Articles
              </h2>
              {isFragile && (
                <span className="text-xs px-2 py-0.5 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-lg border border-orange-100">
                  ⚠ Fragile
                </span>
              )}
            </div>
            <div className="space-y-2">
              {articles.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-[#2563EB] text-xs font-bold">
                      {a.qty}x
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {a.nom}
                      </p>
                      {a.type && (
                        <p className="text-xs text-gray-400">{a.type}</p>
                      )}
                      {a.sku && (
                        <p className="text-xs text-gray-300 dark:text-gray-500">
                          SKU: {a.sku}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.prix > 0 && (
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {(a.prix * a.qty).toLocaleString("fr-FR")} FCFA
                      </span>
                    )}
                    {a.fragile && (
                      <span className="text-xs text-orange-500">Fragile</span>
                    )}
                  </div>
                </div>
              ))}
              {totalPrix > 0 && (
                <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-600">
                  <span className="text-sm text-gray-400">Total</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    {totalPrix.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          {commande.instructions_speciales && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Instructions spéciales
              </h2>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="flex-shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {commande.instructions_speciales}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Assignation
            </h2>
            {commande.statut === "en_attente" ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiClock size={22} className="text-yellow-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Aucun livreur assigné
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition"
                >
                  Assigner un livreur
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {commande.livreur?.name?.charAt(0).toUpperCase() || "L"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {commande.livreur?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {commande.livreur?.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex w-full justify-center px-2.5 py-1.5 rounded-xl text-xs font-medium ${st.cls}`}
                >
                  {st.label}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Source
            </h2>
            <div className="space-y-2 text-sm">
              {[
                {
                  label: "Plateforme",
                  value: commande.source || "Glotelho Shop",
                },
                { label: "ID externe", value: commande.source_id, mono: true },
                {
                  label: "Reçue le",
                  value: commande.created_at
                    ? new Date(commande.created_at).toLocaleDateString("fr-FR")
                    : "—",
                },
              ]
                .filter((i) => i.value)
                .map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-400">{item.label}</span>
                    <span
                      className={`font-medium text-gray-700 dark:text-gray-200 ${item.mono ? "font-mono text-xs" : ""}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {totalPrix > 0 && (
            <div className="bg-[#2563EB] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <FiPackage size={16} />
                <span className="text-sm font-semibold">Résumé</span>
              </div>
              <p className="text-2xl font-bold">
                {totalPrix.toLocaleString("fr-FR")} FCFA
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {articles.reduce((s, a) => s + (a.qty || 0), 0)} article(s)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
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
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAssigner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Livreur
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
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {livreursFiltres.map((l) => (
                    <label
                      key={l.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedLivreur == l.id
                          ? "border-[#2563EB] bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="livreur"
                        value={l.id}
                        checked={selectedLivreur == l.id}
                        onChange={() => setSelected(l.id)}
                        className="hidden"
                      />
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedLivreur == l.id ? "bg-[#2563EB] text-white" : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200"}`}
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
                      {selectedLivreur == l.id && (
                        <FiCheckCircle
                          className="text-[#2563EB] flex-shrink-0"
                          size={14}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-600 pt-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Planifier{" "}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={datePrevue}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDatePrevue(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <input
                    type="time"
                    value={heurePrevue}
                    onChange={(e) => setHeurePrevue(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
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
