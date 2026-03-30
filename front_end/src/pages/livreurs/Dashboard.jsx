import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../../context/AuthContext";
import livreurService from "../../services/livreurService";
import {
  nearestNeighbor,
  geocodeAddress,
  getCurrentPosition,
  formatDistance,
  getRealRoute, // ← ajoute ça
} from "../../utils/geoUtils";
import {
  FiMenu,
  FiHome,
  FiPackage,
  FiClock,
  FiUser,
  FiLogOut,
  FiPlay,
  FiChevronDown,
  FiMapPin,
  FiCheckCircle,
} from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const livreurIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const livraisonIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], 14);
  }, [position]);
  return null;
}

const statusConfig = {
  pending: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En cours", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
};

export default function LivreurDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [livraisons, setLivraisons] = useState([]);
  const [optimized, setOptimized] = useState([]);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [started, setStarted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const watchRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await livreurService.getMesLivraisons();
        setLivraisons(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const handleDemarrer = async () => {
    setGeocoding(true);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);

      const withCoords = await Promise.all(
        livraisons.map(async (liv) => {
          const adresse = liv.commande?.client_adresse || liv.adresse;
          let lat = liv.commande?.latitude || liv.latitude;
          let lng = liv.commande?.longitude || liv.longitude;
          if (!lat || !lng) {
            const coords = await geocodeAddress(adresse);
            if (coords) {
              lat = coords.lat;
              lng = coords.lng;
            }
          }
          return { ...liv, lat: parseFloat(lat), lng: parseFloat(lng) };
        }),
      );

      const sorted = nearestNeighbor(pos.lat, pos.lng, withCoords);
      setOptimized(sorted);

      // Waypoints dans l'ordre optimisé
      const waypoints = [
        { lat: pos.lat, lng: pos.lng },
        ...sorted
          .filter((l) => l.lat && l.lng)
          .map((l) => ({ lat: l.lat, lng: l.lng })),
      ];

      // Vraie route OSRM
      const route = await getRealRoute(waypoints);
      setRouteCoords(route);

      watchRef.current = navigator.geolocation.watchPosition(
        (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
        null,
        { enableHighAccuracy: true },
      );

      setStarted(true);
      setDrawerOpen(true);
    } catch (e) {
      alert(
        "Impossible de récupérer votre position GPS. Vérifiez les permissions.",
      );
    } finally {
      setGeocoding(false);
    }
  };

  const handleTerminer = async (livraison) => {
    try {
      await livreurService.terminer(livraison.id);
      const remaining = optimized.filter((l) => l.id !== livraison.id);

      if (remaining.length > 0 && position) {
        const sorted = nearestNeighbor(position.lat, position.lng, remaining);
        setOptimized(sorted);

        // Recalcule la vraie route depuis la position actuelle
        const waypoints = [
          { lat: position.lat, lng: position.lng },
          ...sorted
            .filter((l) => l.lat && l.lng)
            .map((l) => ({ lat: l.lat, lng: l.lng })),
        ];
        const route = await getRealRoute(waypoints);
        setRouteCoords(route);
      } else {
        setOptimized(remaining);
        setRouteCoords([]);
      }
    } catch (e) {
      alert("Erreur lors de la mise à jour.");
    }
  };

  const defaultPosition = position || { lat: 4.0511, lng: 9.7679 };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* ── Menu latéral ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          <div className="w-72 bg-[#1E293B] h-full flex flex-col shadow-2xl">
            <div className="bg-[#0F172A] px-5 py-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-lg font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{user?.name}</p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
                <span className="inline-flex mt-1 px-2 py-0.5 bg-blue-900 text-blue-300 text-xs rounded-full">
                  Livreur
                </span>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {[
                {
                  label: "Accueil",
                  icon: <FiHome size={16} />,
                  onClick: () => setMenuOpen(false),
                },
                {
                  label: "Mes livraisons",
                  icon: <FiPackage size={16} />,
                  onClick: () => {
                    setMenuOpen(false);
                    navigate("/livreur/livraisons");
                  },
                },
                {
                  label: "Historique",
                  icon: <FiClock size={16} />,
                  onClick: () => {
                    setMenuOpen(false);
                    navigate("/livreur/historique");
                  },
                },
                {
                  label: "Profil",
                  icon: <FiUser size={16} />,
                  onClick: () => {
                    setMenuOpen(false);
                    navigate("/livreur/profile");
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-300 hover:bg-[#334155] hover:text-white transition text-sm"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-gray-700">
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition text-sm"
              >
                <FiLogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-[#2563EB] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMenuOpen(true)}
          className="p-1.5 rounded-lg bg-blue-700 text-white"
        >
          <FiMenu size={20} />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">Glotelho Delivery</p>
          <p className="text-blue-200 text-xs">
            {started
              ? `${optimized.length} livraison(s) restante(s)`
              : `${livraisons.length} livraison(s) assignée(s)`}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold">
          <button
            onClick={() => {
              navigate("/livreur/profile");
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* ── Carte Leaflet ── */}
      <div className="absolute top-14 left-0 right-0 bottom-0 z-0">
        <MapContainer
          center={[defaultPosition.lat, defaultPosition.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <RecenterMap position={position} />}
          {position && (
            <Marker position={[position.lat, position.lng]} icon={livreurIcon}>
              <Popup>Ma position</Popup>
            </Marker>
          )}
          {(started ? optimized : livraisons).map((liv, i) => {
            const lat = liv.lat || liv.commande?.latitude;
            const lng = liv.lng || liv.commande?.longitude;
            if (!lat || !lng) return null;
            return (
              <Marker key={liv.id} position={[lat, lng]} icon={livraisonIcon}>
                <Popup>
                  <strong>
                    #{i + 1} {liv.commande?.client_nom || liv.name}
                  </strong>
                  <br />
                  {liv.commande?.client_adresse || liv.adresse}
                  {liv.distance && (
                    <>
                      <br />
                      <span style={{ color: "#F59E0B" }}>
                        {formatDistance(liv.distance)}
                      </span>
                    </>
                  )}
                </Popup>
              </Marker>
            );
          })}
          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              color="#2563EB"
              weight={4}
              opacity={0.8}
              dashArray="10, 5"
            />
          )}
        </MapContainer>
      </div>

      {/* ── Bouton démarrer ── */}
      {!started && !loading && livraisons.length > 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-[1000]">
          <button
            onClick={handleDemarrer}
            disabled={geocoding}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {geocoding ? (
              <>
                <AiOutlineLoading3Quarters size={20} className="animate-spin" />
                Optimisation en cours...
              </>
            ) : (
              <>
                <FiPlay size={20} />
                Démarrer mes livraisons ({livraisons.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Aucune livraison ── */}
      {!loading && livraisons.length === 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-2xl p-5 text-center shadow-xl">
            <FiPackage size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600 font-medium text-sm">
              Aucune livraison assignée
            </p>
            <p className="text-gray-400 text-xs mt-1">Revenez plus tard</p>
          </div>
        </div>
      )}

      {/* ── Tiroir ── */}
      {started && (
        <div
          className={`absolute left-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${drawerOpen ? "translate-y-0" : "translate-y-[calc(100%-60px)]"}`}
        >
          <div
            className="bg-white rounded-t-3xl px-4 pt-3 pb-2 flex flex-col items-center cursor-pointer shadow-2xl"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
            <div className="flex items-center justify-between w-full">
              <p className="text-sm font-semibold text-gray-800">
                {optimized.length > 0
                  ? `${optimized.length} livraison(s) — Itinéraire optimisé`
                  : "Toutes les livraisons terminées !"}
              </p>
              <FiChevronDown
                className={`text-gray-400 transition-transform ${drawerOpen ? "rotate-180" : ""}`}
                size={20}
              />
            </div>
          </div>

          <div className="bg-white px-4 pb-6 max-h-72 overflow-y-auto">
            {optimized.length === 0 ? (
              <div className="text-center py-8">
                <FiCheckCircle
                  size={40}
                  className="mx-auto mb-3 text-green-400"
                />
                <p className="text-gray-600 font-medium">
                  Toutes les livraisons sont terminées !
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {optimized.map((liv, i) => {
                  const st = statusConfig[liv.status] || {
                    label: liv.status,
                    cls: "bg-gray-50 text-gray-600",
                  };
                  return (
                    <div
                      key={liv.id}
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-sm font-semibold text-gray-800">
                            {liv.commande?.client_nom || liv.name}
                          </p>
                        </div>
                        {liv.distance && (
                          <span className="text-xs font-semibold text-[#F59E0B]">
                            {formatDistance(liv.distance)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-8 mb-3">
                        <FiMapPin
                          size={12}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <p className="text-xs text-gray-500">
                          {liv.commande?.client_adresse || liv.adresse}
                        </p>
                      </div>
                      <div className="flex items-center justify-between ml-8">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/livreur/livraisons/${liv.id}`)
                            }
                            className="text-xs text-[#2563EB] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                          >
                            Détails
                          </button>
                          {liv.status !== "delivered" && (
                            <button
                              onClick={() => handleTerminer(liv)}
                              className="text-xs text-white bg-[#10B981] px-3 py-1.5 rounded-lg hover:bg-green-600 transition flex items-center gap-1"
                            >
                              <FiCheckCircle size={12} />
                              Terminer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
