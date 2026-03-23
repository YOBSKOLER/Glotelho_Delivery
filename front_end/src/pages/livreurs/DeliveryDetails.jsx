import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../../services/api";
import livreurService from "../../services/livreurService";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function LivreurLivraisonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [livraison, setLivraison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(false);
  const [demarring, setDemarring] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/livreur/livraisons/${id}`);
        setLivraison(res.data?.livraison || res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDemarrer = async () => {
    setDemarring(true);
    try {
      await livreurService.demarrer(id);
      setLivraison((prev) => ({ ...prev, status: "in_delivery" }));
    } catch (e) {
      alert("Erreur lors du démarrage.");
    } finally {
      setDemarring(false);
    }
  };

  const handleTerminer = async () => {
    if (!window.confirm("Confirmer la livraison ?")) return;
    setTerminating(true);
    try {
      await livreurService.terminer(id);
      navigate("/livreur/dashboard");
    } catch (e) {
      alert("Erreur lors de la mise à jour.");
    } finally {
      setTerminating(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full" />
      </div>
    );

  if (!livraison)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Livraison introuvable.</p>
      </div>
    );

  const commande = livraison.commande;
  const lat = commande?.latitude || livraison.latitude;
  const lng = commande?.longitude || livraison.longitude;
  const isFragile =
    Array.isArray(commande?.articles) &&
    commande.articles.some((a) => a.fragile);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#2563EB] px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-blue-700 text-white"
        >
          <svg
            width="18"
            height="18"
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
        </button>
        <div>
          <p className="text-white font-semibold text-sm">
            Livraison #{livraison.id}
          </p>
          <p className="text-blue-200 text-xs">
            {commande?.client_nom || livraison.name}
          </p>
        </div>
      </div>

      {/* Carte */}
      {lat && lng ? (
        <div className="h-48">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]}>
              <Popup>{commande?.client_adresse || livraison.adresse}</Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        <div className="h-48 bg-blue-50 flex items-center justify-center">
          <p className="text-gray-400 text-sm">
            Coordonnées GPS non disponibles
          </p>
        </div>
      )}

      {/* Contenu */}
      <div className="px-4 py-4 space-y-4">
        {/* Infos client */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Informations client
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] font-bold text-sm flex-shrink-0">
                {(commande?.client_nom || livraison.name || "C")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {commande?.client_nom || livraison.name}
                </p>
                <p className="text-xs text-gray-400">
                  {commande?.client_telephone || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-2 border-t border-gray-50">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#6B7280"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="mt-0.5 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-sm text-gray-600">
                {commande?.client_adresse || livraison.adresse}
              </p>
            </div>
            {commande?.client_telephone && (
              <a
                href={`tel:${commande.client_telephone}`}
                className="flex items-center gap-2 w-full bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium justify-center mt-2"
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Appeler le client
              </a>
            )}
          </div>
        </div>

        {/* Instructions spéciales */}
        {commande?.instructions_speciales && (
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-yellow-800 mb-1">
                  Instructions spéciales
                </p>
                <p className="text-sm text-yellow-700">
                  {commande.instructions_speciales}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Articles */}
        {commande?.articles && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Articles</h2>
              {isFragile && (
                <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-lg font-medium">
                  ⚠ Fragile
                </span>
              )}
            </div>
            <div className="space-y-2">
              {commande.articles.map((article, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-1 rounded-lg">
                      {article.qty}x
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {article.nom}
                      </p>
                      {article.type && (
                        <p className="text-xs text-gray-400">{article.type}</p>
                      )}
                    </div>
                  </div>
                  {article.fragile && (
                    <span className="text-xs text-orange-500">Fragile</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="px-4 pb-8 space-y-3">
        {livraison.status === "assigned" && (
          <button
            onClick={handleDemarrer}
            disabled={demarring}
            className="w-full bg-[#F59E0B] hover:bg-amber-600 text-white font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            {demarring ? "Démarrage..." : "🚚 Démarrer la livraison"}
          </button>
        )}
        {(livraison.status === "assigned" ||
          livraison.status === "in_delivery") && (
          <button
            onClick={handleTerminer}
            disabled={terminating}
            className="w-full bg-[#10B981] hover:bg-green-600 text-white font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            {terminating ? "Confirmation..." : "✅ Marquer comme livrée"}
          </button>
        )}
        {livraison.status === "delivered" && (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 font-semibold py-4 rounded-2xl text-center">
            ✅ Livraison terminée
          </div>
        )}
      </div>
    </div>
  );
}
