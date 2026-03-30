import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const statutConfig = {
  en_attente: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assignee: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  en_livraison: { label: "En livraison", cls: "bg-orange-50 text-orange-700" },
  livree: { label: "Livrée", cls: "bg-green-50 text-green-700" },
  annulee: { label: "Annulée", cls: "bg-red-50 text-red-500" },
};

export default function AdminCommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [commande, setCommande] = useState(null);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLivreur, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
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
    })();
  }, [id]);

  const handleAssigner = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post(`/admin/commandes/${id}/assigner`, {
        livreur_id: selectedLivreur,
      });
      setCommande(res.data.commande);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'assignation.");
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
              className="h-16 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </AdminLayout>
    );

  if (!commande)
    return (
      <AdminLayout title="Détail commande">
        <p className="text-gray-400">Commande introuvable.</p>
      </AdminLayout>
    );

  const st = statutConfig[commande.statut] || {
    label: commande.statut,
    cls: "bg-gray-50 text-gray-600",
  };
  const isFragile =
    Array.isArray(commande.articles) &&
    commande.articles.some((a) => a.fragile);
  const totalPrix = Array.isArray(commande?.articles)
    ? commande.articles.reduce(
        (total, a) => total + (a.prix || 0) * (a.qty || 1),
        0,
      )
    : 0;

  return (
    <AdminLayout
      title={`Commande #${commande.id}`}
      subtitle="Détails de la commande"
    >
      {/* Back button */}
      <button
        onClick={() => navigate("/admin/commandes")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-5 transition"
      >
        <svg
          width="16"
          height="16"
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
        Retour aux commandes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche — infos client + articles */}
        <div className="lg:col-span-2 space-y-5">
          {/* Infos client */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Informations client
              </h2>
              <span
                className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}
              >
                {st.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Nom</p>
                <p className="text-sm font-medium text-gray-800">
                  {commande.client_nom}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                <p className="text-sm text-gray-800">
                  {commande.client_telephone}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 mb-1">
                  Adresse de livraison
                </p>
                <p className="text-sm text-gray-800">
                  {commande.client_adresse}
                </p>
              </div>
              {commande.latitude && commande.longitude && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Coordonnées GPS</p>
                  <p className="text-sm font-mono text-gray-600">
                    {commande.latitude}, {commande.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Articles commandés
              </h2>
              {isFragile && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-600">
                  ⚠ Contient des articles fragiles
                </span>
              )}
            </div>
            <div className="space-y-3">
              {Array.isArray(commande.articles) &&
                commande.articles.map((article, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#2563EB] text-xs font-bold">
                        {article.qty}x
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {article.nom}
                        </p>
                        {article.type && (
                          <p className="text-xs text-gray-400">
                            {article.type}
                          </p>
                        )}
                        {article.sku && (
                          <p className="text-xs text-gray-300">
                            SKU: {article.sku}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {article.prix > 0 && (
                        <span className="text-xs text-gray-600 font-medium">
                          {article.prix} FCFA
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              {/* Total uniquement si au moins un article a un prix */}
              {totalPrix > 0 && (
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-400">Total</span>
                  <span className="text-sm font-bold text-gray-800">
                    {totalPrix} FCFA
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Instructions spéciales */}
          {commande.instructions_speciales && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                Instructions spéciales
              </h2>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl">
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
                <p className="text-sm text-yellow-800">
                  {commande.instructions_speciales}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — assignation */}
        <div className="space-y-5">
          {/* Statut assignation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Assignation
            </h2>

            {commande.statut === "en_attente" ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg
                    width="22"
                    height="22"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-4">
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
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {commande.livreur?.name?.charAt(0).toUpperCase() || "L"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {commande.livreur?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {commande.livreur?.email || "—"}
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

          {/* Infos source */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Source</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Plateforme</span>
                <span className="text-gray-700 font-medium">
                  {commande.source || "Glotelho Shop"}
                </span>
              </div>
              {commande.source_id && (
                <div className="flex justify-between">
                  <span className="text-gray-400">ID externe</span>
                  <span className="font-mono text-xs text-gray-600">
                    {commande.source_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Reçue le</span>
                <span className="text-gray-700">
                  {commande.created_at
                    ? new Date(commande.created_at).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Assigner */}
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
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAssigner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Choisir un livreur
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {livreurs.map((l) => (
                    <label
                      key={l.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedLivreur == l.id
                          ? "border-[#2563EB] bg-blue-50"
                          : "border-gray-100 hover:bg-gray-50"
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selectedLivreur == l.id
                            ? "bg-[#2563EB] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
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
                        <svg
                          className="ml-auto w-4 h-4 text-[#2563EB]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
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
