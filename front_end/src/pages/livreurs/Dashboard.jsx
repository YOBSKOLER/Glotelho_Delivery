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
  getRealRoute,
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
  FiAlertCircle,
  FiSun,
  FiMoon,
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
const reporteeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], 14);
  }, [map, position]);
  return null;
}

const statusConfig = {
  pending: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En cours", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
  reportee: { label: "Reportée", cls: "bg-purple-50 text-purple-700" },
};

// ── SessionStorage ─
const S = {
  save: (o, r, p) => {
    try {
      sessionStorage.setItem("liv_o", JSON.stringify(o));
      sessionStorage.setItem("liv_r", JSON.stringify(r));
      sessionStorage.setItem("liv_s", "true");
      if (p) sessionStorage.setItem("liv_p", JSON.stringify(p));
    } catch {
      /* empty */
    }
  },
  load: () => {
    try {
      return {
        started: sessionStorage.getItem("liv_s") === "true",
        optimized: JSON.parse(sessionStorage.getItem("liv_o") || "[]"),
        route: JSON.parse(sessionStorage.getItem("liv_r") || "[]"),
        position: JSON.parse(sessionStorage.getItem("liv_p") || "null"),
      };
    } catch {
      return { started: false, optimized: [], route: [], position: null };
    }
  },
  clear: () =>
    ["liv_o", "liv_r", "liv_s", "liv_p"].forEach((k) =>
      sessionStorage.removeItem(k),
    ),
};

export default function LivreurDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [livraisons, setLivraisons] = useState([]);
  const [optimized, setOptimized] = useState([]);
  const [reportees, setReportees] = useState([]);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [started, setStarted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );
  const watchRef = useRef(null);

  // Applique le dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    (async () => {
      try {
        const data = await livreurService.getMesLivraisons();
        setLivraisons(
          data.filter(
            (l) => l.status !== "reportee" && l.status !== "delivered",
          ),
        );
        setReportees(data.filter((l) => l.status === "reportee"));

        const session = S.load();
        if (session.started && session.optimized.length > 0) {
          setOptimized(session.optimized);
          setRouteCoords(session.route);
          setStarted(true);
          if (session.position) setPosition(session.position);
          watchRef.current = navigator.geolocation.watchPosition(
            (p) => {
              const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
              setPosition(pos);
              sessionStorage.setItem("liv_p", JSON.stringify(pos));
            },
            null,
            { enableHighAccuracy: true },
          );
        }
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
          let lat = liv.commande?.latitude || liv.latitude;
          let lng = liv.commande?.longitude || liv.longitude;
          if (!lat || !lng) {
            const coords = await geocodeAddress(
              liv.commande?.client_adresse || liv.adresse,
            );
            if (coords) {
              lat = coords.lat;
              lng = coords.lng;
            }
          }
          return { ...liv, lat: parseFloat(lat), lng: parseFloat(lng) };
        }),
      );

      const sorted = nearestNeighbor(pos.lat, pos.lng, withCoords);
      const waypoints = [
        { lat: pos.lat, lng: pos.lng },
        ...sorted
          .filter((l) => l.lat && l.lng)
          .map((l) => ({ lat: l.lat, lng: l.lng })),
      ];
      const route = await getRealRoute(waypoints);

      setOptimized(sorted);
      setRouteCoords(route);
      S.save(sorted, route, pos);

      watchRef.current = navigator.geolocation.watchPosition(
        (p) => {
          const newPos = { lat: p.coords.latitude, lng: p.coords.longitude };
          setPosition(newPos);
          sessionStorage.setItem("liv_p", JSON.stringify(newPos));
        },
        null,
        { enableHighAccuracy: true },
      );

      setStarted(true);
      setDrawerOpen(true);
    } catch {
      alert("Impossible de récupérer votre position GPS.");
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
        const waypoints = [
          { lat: position.lat, lng: position.lng },
          ...sorted
            .filter((l) => l.lat && l.lng)
            .map((l) => ({ lat: l.lat, lng: l.lng })),
        ];
        const route = await getRealRoute(waypoints);
        setOptimized(sorted);
        setRouteCoords(route);
        S.save(sorted, route, position);
      } else {
        setOptimized([]);
        setRouteCoords([]);
        S.clear();
      }
    } catch {
      alert("Erreur lors de la mise à jour.");
    }
  };

  const defaultPosition = position || { lat: 3.8667, lng: 11.5167 };
  const dm = darkMode;

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${dm ? "bg-gray-950" : "bg-gray-900"}`}
    >
      {/* Menu latéral */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          <div
            className={`w-72 h-full flex flex-col shadow-2xl ${dm ? "bg-gray-900" : "bg-[#1E293B]"}`}
          >
            <div
              className={`px-5 py-6 flex items-center gap-3 ${dm ? "bg-gray-950" : "bg-[#0F172A]"}`}
            >
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
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-300 hover:bg-slate-700 hover:text-white transition text-sm"
                >
                  {item.icon} {item.label}
                </button>
              ))}
              {/* Toggle dark mode dans le menu */}
              <button
                onClick={() => setDarkMode(!dm)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-300 hover:bg-slate-700 hover:text-white transition text-sm"
              >
                {dm ? <FiSun size={16} /> : <FiMoon size={16} />}
                {dm ? "Mode clair" : "Mode sombre"}
              </button>
            </nav>
            <div className="px-3 py-4 border-t border-gray-700">
              <button
                onClick={() => {
                  S.clear();
                  logout();
                  navigate("/login");
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition text-sm"
              >
                <FiLogOut size={16} /> Déconnexion
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      {/* Header */}
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
              ? `${optimized.length} active(s) · ${reportees.length} reportée(s)`
              : `${livraisons.length} livraison(s) assignée(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!dm)}
            className="p-1.5 rounded-lg bg-blue-700 text-white"
          >
            {dm ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold"
              onClick={() => navigate("/livreur/profile")}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {reportees.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {reportees.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="absolute top-14 left-0 right-0 bottom-0 z-0">
        <MapContainer
          center={[defaultPosition.lat, defaultPosition.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url={
              dm
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
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
          {reportees.map((liv) => {
            const lat = liv.commande?.latitude || liv.latitude;
            const lng = liv.commande?.longitude || liv.longitude;
            if (!lat || !lng) return null;
            return (
              <Marker
                key={`rep-${liv.id}`}
                position={[lat, lng]}
                icon={reporteeIcon}
              >
                <Popup>
                  <strong>Reportée</strong>
                  <br />
                  {liv.commande?.client_nom || liv.name}
                  {liv.raison_report && (
                    <>
                      <br />
                      <span style={{ color: "#7C3AED" }}>
                        {liv.raison_report}
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
              dashArray="10,5"
            />
          )}
        </MapContainer>
      </div>

      {/* Bouton démarrer */}
      {!started && !loading && livraisons.length > 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-[1000] space-y-3">
          {reportees.length > 0 && (
            <div className="bg-purple-600 bg-opacity-90 rounded-2xl px-4 py-3 flex items-center gap-2">
              <FiAlertCircle size={16} className="text-white flex-shrink-0" />
              <p className="text-white text-xs font-medium">
                {reportees.length} livraison(s) reportée(s) — voir dans le
                tiroir
              </p>
            </div>
          )}
          <button
            onClick={handleDemarrer}
            disabled={geocoding}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {geocoding ? (
              <>
                <AiOutlineLoading3Quarters size={20} className="animate-spin" />{" "}
                Optimisation...
              </>
            ) : (
              <>
                <FiPlay size={20} /> Démarrer ({livraisons.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Aucune livraison */}
      {!loading && livraisons.length === 0 && reportees.length === 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-[1000]">
          <div
            className={`rounded-2xl p-5 text-center shadow-xl ${dm ? "bg-gray-800" : "bg-white"}`}
          >
            <FiPackage size={32} className="mx-auto mb-2 text-gray-400" />
            <p
              className={`font-medium text-sm ${dm ? "text-gray-300" : "text-gray-600"}`}
            >
              Aucune livraison assignée
            </p>
          </div>
        </div>
      )}

      {/* Tiroir */}
      {(started || reportees.length > 0) && (
        <div
          className={`absolute left-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${drawerOpen ? "translate-y-0" : "translate-y-[calc(100%-64px)]"}`}
        >
          {/* Handle */}
          <div
            className={`rounded-t-3xl px-4 pt-3 pb-2 flex flex-col items-center cursor-pointer shadow-2xl ${dm ? "bg-gray-900" : "bg-white"}`}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <div
              className={`w-10 h-1 rounded-full mb-2 ${dm ? "bg-gray-600" : "bg-gray-300"}`}
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${dm ? "text-gray-200" : "text-gray-800"}`}
                >
                  {optimized.length > 0
                    ? `${optimized.length} livraison(s) optimisée(s)`
                    : "Livraisons actives terminées"}
                </p>
                {reportees.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {reportees.length} reportée(s)
                  </span>
                )}
              </div>
              <FiChevronDown
                className={`transition-transform ${drawerOpen ? "rotate-180" : ""} ${dm ? "text-gray-400" : "text-gray-400"}`}
                size={20}
              />
            </div>
          </div>

          <div
            className={`px-4 pb-6 max-h-80 overflow-y-auto ${dm ? "bg-gray-900" : "bg-white"}`}
          >
            {/* Reportées — toujours en haut */}
            {reportees.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 py-2 mb-2 border-b border-purple-100">
                  <FiAlertCircle size={13} className="text-purple-500" />
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    À ne pas oublier
                  </p>
                </div>
                <div className="space-y-2">
                  {reportees.map((liv) => (
                    <div
                      key={liv.id}
                      onClick={() => navigate(`/livreur/livraisons/${liv.id}`)}
                      className="bg-purple-50 rounded-2xl p-4 border border-purple-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {liv.commande?.client_nom || liv.name}
                        </p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-medium">
                          Reportée
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <FiMapPin size={11} className="text-gray-400" />
                          <p className="text-xs text-gray-500 truncate">
                            {liv.commande?.client_adresse || liv.adresse}
                          </p>
                        </div>
                        {liv.raison_report && (
                          <p className="text-xs text-purple-600 font-medium">
                            ⚠ {liv.raison_report}
                          </p>
                        )}
                        {liv.date_livraison_prevue && (
                          <p className="text-xs text-purple-700 font-semibold">
                            {" "}
                            {new Date(liv.date_livraison_prevue).toLocaleString(
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
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() =>
                            navigate(`/livreur/livraisons/${liv.id}`)
                          }
                          className="text-xs text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition"
                        >
                          Voir détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimisées */}
            {optimized.length === 0 && reportees.length === 0 ? (
              <div className="text-center py-6">
                <FiCheckCircle
                  size={36}
                  className="mx-auto mb-3 text-green-400"
                />
                <p
                  className={`font-medium ${dm ? "text-gray-300" : "text-gray-600"}`}
                >
                  Toutes les livraisons sont terminées !
                </p>
              </div>
            ) : optimized.length > 0 ? (
              <div>
                {reportees.length > 0 && (
                  <div className="flex items-center gap-2 py-2 mb-2 border-b border-blue-100">
                    <FiPackage size={13} className="text-blue-500" />
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Itinéraire optimisé
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {optimized.map((liv, i) => {
                    const st = statusConfig[liv.status] || {
                      label: liv.status,
                      cls: "bg-gray-50 text-gray-600",
                    };
                    return (
                      <div
                        key={liv.id}
                        onClick={() =>
                          navigate(`/livreur/livraisons/${liv.id}`)
                        }
                        className={`rounded-2xl p-4 border ${dm ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <p
                              className={`text-sm font-semibold ${dm ? "text-gray-100" : "text-gray-800"}`}
                            >
                              {liv.commande?.client_nom || liv.name}
                            </p>
                          </div>
                          {liv.distance && (
                            <span className="text-xs font-semibold text-[#F59E0B]">
                              {formatDistance(liv.distance)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-8 mb-2">
                          <FiMapPin
                            size={11}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <p
                            className={`text-xs truncate ${dm ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {liv.commande?.client_adresse || liv.adresse}
                          </p>
                        </div>
                        {liv.date_livraison_prevue && (
                          <div className="ml-8 mb-2">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                              {" "}
                              {new Date(
                                liv.date_livraison_prevue,
                              ).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
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
                                <FiCheckCircle size={11} /> Terminer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
