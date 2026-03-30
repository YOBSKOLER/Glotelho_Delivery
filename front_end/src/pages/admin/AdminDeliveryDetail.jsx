import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const statusConfig = {
  pending: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En livraison", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
};

export default function AdminLivraisonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [livraison, setLivraison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/admin/livraisons/${id}`);
        setLivraison(res.data?.livraison || res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <AdminLayout title="Détail livraison">
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

  if (!livraison)
    return (
      <AdminLayout title="Détail livraison">
        <p className="text-gray-400 text-sm">Livraison introuvable.</p>
      </AdminLayout>
    );

  const st = statusConfig[livraison.status] || {
    label: livraison.status,
    cls: "bg-gray-50 text-gray-600",
  };
  const commande = livraison.commande;
  const isFragile =
    Array.isArray(commande?.articles) &&
    commande.articles.some((a) => a.fragile);

  // Calcul du total prix — on vérifie que prix existe avant de calculer
  const totalPrix = Array.isArray(commande?.articles)
    ? commande.articles.reduce(
        (total, a) => total + (a.prix || 0) * (a.qty || 1),
        0,
      )
    : 0;

  return (
    <AdminLayout
      title={`Livraison #${livraison.id}`}
      subtitle="Détails de la livraison"
    >
      {/* Retour — pointe vers la page unifiée commandes */}
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
        {/* Colonne gauche */}
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
                  {commande?.client_nom || livraison.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                <p className="text-sm text-gray-800">
                  {commande?.client_telephone || "—"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 mb-1">
                  Adresse de livraison
                </p>
                <p className="text-sm text-gray-800">
                  {commande?.client_adresse || livraison.adresse || "—"}
                </p>
              </div>
              {(livraison.latitude || commande?.latitude) && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Coordonnées GPS</p>
                  <p className="text-sm font-mono text-gray-600">
                    {commande?.latitude || livraison.latitude},{" "}
                    {commande?.longitude || livraison.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Articles */}
          {commande?.articles && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">
                  Articles
                </h2>
                {isFragile && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-600">
                    ⚠ Fragile
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {commande.articles.map((article, i) => (
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
                      {article.fragile && (
                        <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-500 rounded-lg">
                          Fragile
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
          )}

          {/* Instructions */}
          {commande?.instructions_speciales && (
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

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Livreur */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Livreur assigné
            </h2>
            {livraison.livreur ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {livraison.livreur.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {livraison.livreur.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {livraison.livreur.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Aucun livreur assigné
              </p>
            )}
          </div>

          {/* Infos livraison */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Informations
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-400">ID Livraison</span>
                <span className="font-mono text-gray-700">#{livraison.id}</span>
              </div>
              {commande && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400">ID Commande</span>
                  <span className="font-mono text-gray-700">
                    #{commande.id}
                  </span>
                </div>
              )}
              {commande?.source_id && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400">Ref. Magento</span>
                  <span className="font-mono text-xs text-gray-600">
                    {commande.source_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-400">Date livraison</span>
                <span className="text-gray-700">
                  {livraison.date_livraison
                    ? new Date(livraison.date_livraison).toLocaleDateString(
                        "fr-FR",
                      )
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Créée le</span>
                <span className="text-gray-700">
                  {livraison.created_at
                    ? new Date(livraison.created_at).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Lien commande */}
          {commande && (
            <button
              onClick={() => navigate(`/admin/commandes/${commande.id}`)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Voir la commande associée
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
