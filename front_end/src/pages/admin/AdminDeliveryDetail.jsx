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
  FiClock,
  FiAlertCircle,
  FiStar,
  FiCamera,
} from "react-icons/fi";

const statusConfig = {
  pending: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En livraison", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
  reportee: { label: "Reportée", cls: "bg-purple-50 text-purple-700" },
};

function StarRating({ note }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          size={16}
          className={
            i <= note ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
          }
        />
      ))}
      <span className="text-sm font-semibold text-gray-700 ml-1">{note}/5</span>
    </div>
  );
}

export default function AdminLivraisonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [livraison, setLivraison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showSig, setShowSig] = useState(false);

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
  const articles = Array.isArray(commande?.articles) ? commande.articles : [];
  const totalPrix = articles.reduce(
    (s, a) => s + (a.prix || 0) * (a.qty || 1),
    0,
  );
  const isFragile = articles.some((a) => a.fragile);

  return (
    <AdminLayout title={`Livraison #${livraison.id}`} subtitle="Détails">
      <button
        onClick={() => navigate("/admin/commandes")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-5 transition"
      >
        <FiArrowLeft size={16} /> Retour aux commandes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-5">
          {/* Alert report */}
          {livraison.status === "reportee" && (
            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <FiAlertCircle size={18} className="text-purple-600" />
                <h3 className="text-sm font-bold text-purple-800">
                  Livraison reportée
                </h3>
                {livraison.nb_reports > 0 && (
                  <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg font-medium">
                    {livraison.nb_reports} report(s)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-purple-500 mb-1">Raison</p>
                  <p className="text-sm font-semibold text-purple-800">
                    {livraison.raison_report || "—"}
                  </p>
                </div>
                {livraison.date_livraison_prevue && (
                  <div>
                    <p className="text-xs text-purple-500 mb-1">Nouveau RDV</p>
                    <p className="text-sm font-semibold text-purple-800">
                      {new Date(livraison.date_livraison_prevue).toLocaleString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                )}
                {livraison.note_report && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-purple-500 mb-1">
                      Note du livreur
                    </p>
                    <p className="text-sm text-purple-700 italic">
                      "{livraison.note_report}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

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
              <div className="flex items-start gap-2">
                <FiUser size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Nom</p>
                  <p className="text-sm font-medium text-gray-800">
                    {commande?.client_nom || livraison.name || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FiPhone size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Téléphone</p>
                  <p className="text-sm text-gray-800">
                    {commande?.client_telephone || "—"}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2">
                <FiMapPin size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Adresse</p>
                  <p className="text-sm text-gray-800">
                    {commande?.client_adresse || livraison.adresse || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preuves de livraison */}
          {(livraison.preuve_photo || livraison.preuve_signature) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Preuves de livraison
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {livraison.preuve_photo && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">
                      <FiCamera /> Photo du colis
                    </p>
                    <img
                      src={livraison.preuve_photo}
                      alt="Preuve"
                      onClick={() => setShowPhoto(true)}
                      className="w-full h-32 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition"
                    />
                  </div>
                )}
                {livraison.preuve_signature && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">
                      Signature client
                    </p>
                    <img
                      src={livraison.preuve_signature}
                      alt="Signature"
                      onClick={() => setShowSig(true)}
                      className="w-full h-32 object-contain rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:opacity-90 transition p-2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note client */}
          {livraison.note_client && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Évaluation client
              </h2>
              <StarRating note={livraison.note_client} />
              {livraison.commentaire_client && (
                <p className="text-sm text-gray-600 italic mt-3 pl-3 border-l-2 border-yellow-300">
                  "{livraison.commentaire_client}"
                </p>
              )}
            </div>
          )}

          {/* Articles */}
          {articles.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">
                  Articles
                </h2>
                {isFragile && (
                  <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-500 rounded-lg">
                    ⚠ Fragile
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {articles.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#2563EB] text-xs font-bold">
                        {a.qty}x
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {a.nom}
                        </p>
                        {a.sku && (
                          <p className="text-xs text-gray-300">SKU: {a.sku}</p>
                        )}
                      </div>
                    </div>
                    {a.prix > 0 && (
                      <span className="text-xs font-semibold text-gray-600">
                        {(a.prix * a.qty).toLocaleString("fr-FR")} FCFA
                      </span>
                    )}
                  </div>
                ))}
                {totalPrix > 0 && (
                  <div className="flex justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-400">Total</span>
                    <span className="text-sm font-bold text-gray-800">
                      {totalPrix.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Livreur */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Livreur
            </h2>
            {livraison.livreur ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {livraison.livreur.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
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

          {/* Infos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Informations
            </h2>
            <div className="space-y-2 text-sm">
              {[
                {
                  label: "ID Livraison",
                  value: `#${livraison.id}`,
                  mono: true,
                },
                {
                  label: "ID Commande",
                  value: commande ? `#${commande.id}` : "—",
                  mono: true,
                },
                {
                  label: "Ref. Magento",
                  value: commande?.source_id || "—",
                  mono: true,
                },
                { label: "Nb. reports", value: livraison.nb_reports || "0" },
                {
                  label: "Date",
                  value: livraison.date_livraison
                    ? new Date(livraison.date_livraison).toLocaleDateString(
                        "fr-FR",
                      )
                    : "—",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-400 text-xs">{item.label}</span>
                  <span
                    className={`text-xs font-medium text-gray-700 ${item.mono ? "font-mono" : ""}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {commande && (
            <button
              onClick={() => navigate(`/admin/commandes/${commande.id}`)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              <FiPackage size={14} /> Voir la commande
            </button>
          )}
        </div>
      </div>

      {/* Lightbox photo */}
      {showPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPhoto(false)}
        >
          <img
            src={livraison.preuve_photo}
            alt="Preuve"
            className="max-w-full max-h-full rounded-2xl"
          />
        </div>
      )}

      {/* Lightbox signature */}
      {showSig && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSig(false)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Signature du client
            </p>
            <img
              src={livraison.preuve_signature}
              alt="Signature"
              className="w-full rounded-xl border border-gray-200"
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
