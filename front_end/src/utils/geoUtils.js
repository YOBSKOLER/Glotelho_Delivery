// ─── Haversine distance (km) ──────────────────────────────────────────────────
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Calcule la distance totale d'une route ───────────────────────────────────
function totalRouteDistance(route) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += haversineDistance(
      route[i].lat,
      route[i].lng,
      route[i + 1].lat,
      route[i + 1].lng,
    );
  }
  return total;
}

// ─── Nearest Neighbor ─────────────────────────────────────────────────────────
function nearestNeighborBase(startLat, startLon, livraisons) {
  const remaining = livraisons
    .filter((l) => l.lat && l.lng)
    .map((l) => ({ ...l }));
  const sorted = [];
  let fromLat = startLat;
  let fromLon = startLon;

  while (remaining.length > 0) {
    remaining.forEach((l) => {
      l.distance = haversineDistance(fromLat, fromLon, l.lat, l.lng);
    });
    remaining.sort((a, b) => a.distance - b.distance);
    const nearest = remaining.shift();
    sorted.push(nearest);
    fromLat = nearest.lat;
    fromLon = nearest.lng;
  }
  return sorted;
}

// ─── 2-opt improvement ────────────────────────────────────────────────────────
// Améliore la route en inversant des segments jusqu'à ne plus pouvoir améliorer
function twoOpt(start, route) {
  let improved = true;
  let best = [...route];

  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        // Inverse le segment entre i et j
        const newRoute = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];

        const fullCurrent = [start, ...best];
        const fullNew = [start, ...newRoute];

        if (totalRouteDistance(fullNew) < totalRouteDistance(fullCurrent)) {
          best = newRoute;
          improved = true;
        }
      }
    }
  }

  // Recalcule les distances depuis le point de départ après optimisation
  let fromLat = start.lat;
  let fromLon = start.lng;
  return best.map((l) => {
    const distance = haversineDistance(fromLat, fromLon, l.lat, l.lng);
    fromLat = l.lat;
    fromLon = l.lng;
    return { ...l, distance };
  });
}

// ─── Nearest Neighbor + 2-opt (algorithme principal) ─────────────────────────
export function nearestNeighbor(currentLat, currentLon, livraisons) {
  if (!livraisons || livraisons.length === 0) return [];

  const start = { lat: currentLat, lng: currentLon };

  // Étape 1 — Nearest Neighbor pour un premier ordre
  const nnRoute = nearestNeighborBase(currentLat, currentLon, livraisons);

  // Étape 2 — 2-opt pour améliorer cet ordre
  // (ne tourne pas si 1 seule livraison)
  if (nnRoute.length <= 1) {
    return nnRoute.map((l) => ({
      ...l,
      distance: haversineDistance(currentLat, currentLon, l.lat, l.lng),
    }));
  }

  const optimized = twoOpt(start, nnRoute);
  return optimized;
}

// ─── Géocodage Nominatim ──────────────────────────────────────────────────────
export async function geocodeAddress(address) {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { "Accept-Language": "fr" } },
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Position GPS ─────────────────────────────────────────────────────────────
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

// ─── Vraie route OSRM ────────────────────────────────────────────────────────
export async function getRealRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return [];
  try {
    const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return waypoints.map((p) => [p.lat, p.lng]);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length)
      return waypoints.map((p) => [p.lat, p.lng]);
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {
    return waypoints.map((p) => [p.lat, p.lng]);
  }
}
