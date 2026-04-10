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
  FiCalendar,
} from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

// ── Icônes SVG inline (pas de réseau requis) ─────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

const svgIcon = (color) =>
  new L.DivIcon({
    html: `<svg width="28" height="42" viewBox="0 0 28 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.3 21.7 0 14 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`,
    className: "",
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -42],
  });

const livreurIcon = svgIcon("#2563EB");
const livraisonIcon = svgIcon("#F59E0B");
const reporteeIcon = svgIcon("#7C3AED");

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], 14);
  }, [map, position]);
  return null;
}

const statusConfig = {
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En cours", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
  reportee: { label: "Reportée", cls: "bg-purple-50 text-purple-700" },
};

// ── Date helpers ──────────────────────────────────────────────────────────────
const toDateStr = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
const todayStr = () => toDateStr(new Date());
const isScheduledToday = (dateStr) =>
  !!dateStr && toDateStr(dateStr) === todayStr();

// ── SessionStorage ─────────────────────────────────────────────────────────────
const S = {
  save: (o, r, p) => {
    try {
      sessionStorage.setItem("liv_o", JSON.stringify(o));
      sessionStorage.setItem("liv_r", JSON.stringify(r));
      sessionStorage.setItem("liv_s", "true");
      if (p) sessionStorage.setItem("liv_p", JSON.stringify(p));
    } catch { /* empty */ }
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

  // toutes les livraisons du jour = actives + reportées pour aujourd'hui
  const [toutesLivraisons, setToutesLivraisons] = useState([]);
  // liste optimisée par nearest neighbor (contient actives + reportées du jour mélangées)
  const [optimized, setOptimized] = useState([]);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [started, setStarted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [dark, setDark] = useState(
    () => localStorage.getItem("livreurDark") === "true",
  );
  const watchRef = useRef(null);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("livreurDark", dark);
  }, [dark]);

  // ── Charge toutes les livraisons du jour ──────────────────────────────────
  // = actives (assigned/in_delivery) + reportées programmées pour aujourd'hui
  const loadLivraisons = async () => {
    const data = await livreurService.getMesLivraisons();

    const actives = data.filter(
      (l) => l.status === "assigned" || l.status === "in_delivery",
    );
    const reporteesAujourd = data.filter(
      (l) =>
        l.status === "reportee" && isScheduledToday(l.date_livraison_prevue),
    );

    // Fusion : actives + reportées du jour (reportées marquées)
    const toutes = [
      ...actives,
      ...reporteesAujourd.map((l) => ({ ...l, _reportee: true })),
    ];

    setToutesLivraisons(toutes);
    return toutes;
  };

  useEffect(() => {
    (async () => {
      try {
        const toutes = await loadLivraisons();

        // Restaure session — filtre les livraisons encore valides
        const session = S.load();
        if (session.started && session.optimized.length > 0) {
          const ids = new Set(toutes.map((l) => l.id));
          const stillValid = session.optimized.filter(
            (l) => ids.has(l.id) && l.status !== "delivered",
          );

          if (stillValid.length > 0) {
            setOptimized(stillValid);
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
          } else {
            S.clear();
          }
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

  // ── Géocode une livraison si pas de coords ────────────────────────────────
  const addCoords = async (liv) => {
    let lat = parseFloat(liv.commande?.latitude || liv.latitude);
    let lng = parseFloat(liv.commande?.longitude || liv.longitude);
    if (!lat || !lng) {
      const adresse = liv.commande?.client_adresse || liv.adresse;
      if (adresse) {
        const coords = await geocodeAddress(adresse);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }
    }
    return { ...liv, lat: lat || null, lng: lng || null };
  };

  // ── Démarrer — Nearest Neighbor + OSRM ───────────────────────────────────
  const handleDemarrer = async () => {
    setGeocoding(true);
    try {
      // 1. Recharge données fraîches
      const toutes = await loadLivraisons();
      if (toutes.length === 0) {
        alert("Aucune livraison pour aujourd'hui.");
        return;
      }

      // 2. Position GPS du livreur
      const pos = await getCurrentPosition();
      setPosition(pos);

      // 3. Géocode toutes les livraisons du jour
      const withCoords = await Promise.all(toutes.map(addCoords));
      const valid = withCoords.filter((l) => l.lat && l.lng);

      if (valid.length === 0) {
        alert("Impossible de géolocaliser les livraisons.");
        return;
      }

      // 4. Nearest Neighbor — optimise l'ordre de toutes les livraisons du jour
      //    (actives + reportées d'aujourd'hui mélangées)
      const sorted = nearestNeighbor(pos.lat, pos.lng, valid);

      // 5. OSRM — récupère le vrai itinéraire routier
      const waypoints = [
        { lat: pos.lat, lng: pos.lng },
        ...sorted.map((l) => ({ lat: l.lat, lng: l.lng })),
      ];
      const route = await getRealRoute(waypoints);

      setOptimized(sorted);
      setRouteCoords(route);
      S.save(sorted, route, pos);

      // 6. Suivi GPS en temps réel
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
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
    } catch (e) {
      console.error(e);
      alert(
        "Impossible de récupérer votre position GPS. Vérifiez les permissions.",
      );
    } finally {
      setGeocoding(false);
    }
  };

  // ── Terminer depuis le tiroir ─────────────────────────────────────────────
  const handleTerminer = async (livraison) => {
    try {
      await livreurService.terminer(livraison.id);

      const remaining = optimized.filter((l) => l.id !== livraison.id);
      setToutesLivraisons((prev) => prev.filter((l) => l.id !== livraison.id));

      if (remaining.length > 0 && position) {
        // Recalcule nearest neighbor depuis la position actuelle
        const sorted = nearestNeighbor(
          position.lat,
          position.lng,
          remaining.filter((l) => l.lat && l.lng),
        );
        const waypoints = [
          { lat: position.lat, lng: position.lng },
          ...sorted.map((l) => ({ lat: l.lat, lng: l.lng })),
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

  const defaultPos = position || { lat: 4.0511, lng: 9.7085 };
  const nbActives = optimized.filter((l) => !l._reportee).length;
  const nbReportees = optimized.filter((l) => l._reportee).length;

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${dark ? "bg-gray-950" : "bg-gray-100"}`}
    >
      {/* ── Menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          <div
            className={`w-72 h-full flex flex-col shadow-2xl ${dark ? "bg-gray-900" : "bg-[#1E293B]"}`}
          >
            <div
              className={`px-5 py-6 flex items-center gap-3 ${dark ? "bg-gray-950" : "bg-[#0F172A]"}`}
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
                // ← Mes livraisons → /livreur/livraisons
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
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-300 hover:bg-slate-700 hover:text-white transition text-sm"
              >
                {dark ? <FiSun size={16} /> : <FiMoon size={16} />}{" "}
                {dark ? "Mode clair" : "Mode sombre"}
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
              ? `${nbActives} active(s)${nbReportees > 0 ? ` · ${nbReportees} reportée(s)` : ""}`
              : `${toutesLivraisons.length} livraison(s) aujourd'hui`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDark(!dark)}
            className="p-1.5 rounded-lg bg-blue-700 text-white"
          >
            {dark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Carte Leaflet ── */}
      <div className="absolute top-14 left-0 right-0 bottom-0 z-0">
        <MapContainer
          center={[defaultPos.lat, defaultPos.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url={
              dark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />

          {position && <RecenterMap position={position} />}
          {position && (
            <Marker position={[position.lat, position.lng]} icon={livreurIcon}>
              <Popup> Ma position</Popup>
            </Marker>
          )}

          {/* Marqueurs livraisons du jour (avant démarrage : toutesLivraisons, après : optimized) */}
          {(started ? optimized : toutesLivraisons).map((liv, i) => {
            const lat = liv.lat || liv.commande?.latitude;
            const lng = liv.lng || liv.commande?.longitude;
            if (!lat || !lng) return null;
            const icon = liv._reportee ? reporteeIcon : livraisonIcon;
            return (
              <Marker key={liv.id} position={[lat, lng]} icon={icon}>
                <Popup>
                  <strong>
                    #{i + 1} {liv.commande?.client_nom || liv.name}
                  </strong>
                  {liv._reportee && (
                    <>
                      <br />
                      <span style={{ color: "#7C3AED" }}> <FiCalendar/> Reportée</span>
                    </>
                  )}
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

          {/* Itinéraire OSRM — vrai tracé routier */}
          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              color="#2563EB"
              weight={4}
              opacity={0.85}
              dashArray="10,6"
            />
          )}
        </MapContainer>
      </div>

      {/* ── Bouton démarrer ── */}
      {!started && !loading && toutesLivraisons.length > 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-[1000]">
          <button
            onClick={handleDemarrer}
            disabled={geocoding}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {geocoding ? (
              <>
                <AiOutlineLoading3Quarters size={20} className="animate-spin" />{" "}
                Optimisation du parcours...
              </>
            ) : (
              <>
                <FiPlay size={20} /> Démarrer les livraisons du jour (
                {toutesLivraisons.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Aucune livraison ── */}
      {!loading && toutesLivraisons.length === 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-[1000]">
          <div
            className={`rounded-2xl p-5 text-center shadow-xl ${dark ? "bg-gray-800" : "bg-white"}`}
          >
            <FiPackage size={32} className="mx-auto mb-2 text-gray-400" />
            <p
              className={`font-medium text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              Aucune livraison pour aujourd'hui
            </p>
          </div>
        </div>
      )}

      {/* ── Tiroir ── */}
      {started && (
        <div
          className={`absolute left-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ${drawerOpen ? "translate-y-0" : "translate-y-[calc(100%-64px)]"}`}
        >
          {/* Handle */}
          <div
            className={`rounded-t-3xl px-4 pt-3 pb-2 flex flex-col items-center cursor-pointer shadow-2xl ${dark ? "bg-gray-900" : "bg-white"}`}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <div
              className={`w-10 h-1 rounded-full mb-2 ${dark ? "bg-gray-600" : "bg-gray-300"}`}
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${dark ? "text-gray-200" : "text-gray-800"}`}
                >
                  {optimized.length > 0
                    ? `Parcours du jour — ${optimized.length} livraison(s)`
                    : "Toutes les livraisons terminées !"}
                </p>
                {nbReportees > 0 && (
                  <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">
                    {nbReportees} reportée(s)
                  </span>
                )}
              </div>
              <FiChevronDown
                className={`text-gray-400 transition-transform ${drawerOpen ? "rotate-180" : ""}`}
                size={20}
              />
            </div>
          </div>

          {/* Liste */}
          <div
            className={`px-4 pb-6 max-h-80 overflow-y-auto ${dark ? "bg-gray-900" : "bg-white"}`}
          >
            {optimized.length === 0 ? (
              <div className="text-center py-6">
                <FiCheckCircle
                  size={36}
                  className="mx-auto mb-3 text-green-400"
                />
                <p
                  className={`font-medium ${dark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Toutes les livraisons du jour sont terminées ! 
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {optimized.map((liv, i) => {
                  const st = statusConfig[liv.status] || {
                    label: liv.status,
                    cls: "bg-gray-50 text-gray-600",
                  };
                  const isRep = !!liv._reportee;

                  return (
                    // ← Click sur la carte → détail livraison
                    <div
                      key={liv.id}
                      onClick={() => navigate(`/livreur/livraisons/${liv.id}`)}
                      className={`rounded-2xl p-4 border cursor-pointer hover:shadow-md transition-shadow ${
                        isRep
                          ? dark
                            ? "bg-purple-900/20 border-purple-700"
                            : "bg-purple-50 border-purple-200"
                          : dark
                            ? "bg-gray-800 border-gray-700"
                            : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      {/* En-tête de la carte */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {/* Numéro d'ordre */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isRep ? "bg-purple-500" : "bg-[#2563EB]"}`}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-semibold ${dark ? "text-gray-100" : "text-gray-800"}`}
                            >
                              {liv.commande?.client_nom || liv.name}
                            </p>
                            {isRep && (
                              <span className="text-xs text-purple-600 dark:text-purple-300 font-semibold">
                                Reportée
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {liv.distance && (
                            <span className="text-xs font-semibold text-[#F59E0B]">
                              {formatDistance(liv.distance)}
                            </span>
                          )}
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${isRep ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" : st.cls}`}
                          >
                            {isRep ? "Reportée" : st.label}
                          </span>
                        </div>
                      </div>

                      {/* Adresse */}
                      <div className="flex items-center gap-1 ml-8 mb-2">
                        <FiMapPin
                          size={11}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <p
                          className={`text-xs truncate ${dark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {liv.commande?.client_adresse || liv.adresse}
                        </p>
                      </div>

                      {/* Heure prévue */}
                      {liv.date_livraison_prevue && (
                        <div className="ml-8 mb-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-lg font-medium ${isRep ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" : "bg-blue-50 text-blue-600"}`}
                          >
                            <FiClock />{" "}
                            {new Date(
                              liv.date_livraison_prevue,
                            ).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Raison du report si reportée */}
                      {isRep && liv.raison_report && (
                        <div className="ml-8 mb-2 flex items-center gap-1">
                          <FiAlertCircle
                            size={11}
                            className="text-purple-400 flex-shrink-0"
                          />
                          <p className="text-xs text-purple-600 dark:text-purple-300">
                            {liv.raison_report}
                          </p>
                        </div>
                      )}

                      {/* Actions — stopPropagation pour éviter double navigation */}
                      <div className="flex items-center justify-between ml-8 mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Tap pour voir les détails →
                        </span>
                        {!isRep && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTerminer(liv);
                            }}
                            className="text-xs text-white bg-[#10B981] px-3 py-1.5 rounded-lg hover:bg-green-600 transition flex items-center gap-1"
                          >
                            <FiCheckCircle size={11} /> Terminer
                          </button>
                        )}
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
