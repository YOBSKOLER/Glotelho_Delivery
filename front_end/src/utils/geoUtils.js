// ─── Calcul de distance Haversine (en km) ────────────────────────────────────
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
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Formate la distance en texte lisible ─────────────────────────────────────
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Algorithme Nearest Neighbor ─────────────────────────────────────────────
// Prend la position du livreur + liste de livraisons avec coords
// Retourne la liste triée du plus proche au plus loin
export function nearestNeighbor(currentLat, currentLon, livraisons) {
  if (!livraisons || livraisons.length === 0) return [];

  const remaining = livraisons
    .filter((l) => l.lat && l.lng)
    .map((l) => ({
      ...l,
      distance: haversineDistance(currentLat, currentLon, l.lat, l.lng),
    }));

  const sorted = [];
  let fromLat = currentLat;
  let fromLon = currentLon;

  while (remaining.length > 0) {
    // Recalcule les distances depuis la position courante
    remaining.forEach((l) => {
      l.distance = haversineDistance(fromLat, fromLon, l.lat, l.lng);
    });

    // Trouve la plus proche
    remaining.sort((a, b) => a.distance - b.distance);
    const nearest = remaining.shift();
    sorted.push(nearest);

    // La prochaine étape part de la livraison qu'on vient d'ajouter
    fromLat = nearest.lat;
    fromLon = nearest.lng;
  }

  return sorted;
}

// ─── Géocodage via Nominatim (OpenStreetMap) ─────────────────────────────────
export async function geocodeAddress(address) {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { "Accept-Language": "fr" } },
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Récupère la position GPS du livreur ──────────────────────────────────────
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
