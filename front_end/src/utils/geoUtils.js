// ── Haversine distance (km) ───────────────────────────────────────────────────
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Distance totale ───────────────────────────────────────────────────────────
function totalDistance(route) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++)
    d += haversineDistance(
      route[i].lat,
      route[i].lng,
      route[i + 1].lat,
      route[i + 1].lng,
    );
  return d;
}

// ── Nearest Neighbor base ─────────────────────────────────────────────────────
function nnBase(fromLat, fromLng, livraisons) {
  const rem = livraisons.filter((l) => l.lat && l.lng).map((l) => ({ ...l }));
  const sorted = [];
  let lat = fromLat,
    lng = fromLng;
  while (rem.length > 0) {
    rem.forEach((l) => {
      l._d = haversineDistance(lat, lng, l.lat, l.lng);
    });
    rem.sort((a, b) => a._d - b._d);
    const nearest = rem.shift();
    sorted.push({ ...nearest, distance: nearest._d });
    lat = nearest.lat;
    lng = nearest.lng;
  }
  return sorted;
}

// ── 2-opt amélioration ────────────────────────────────────────────────────────
function twoOpt(start, route) {
  let best = [...route];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const newRoute = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        if (
          totalDistance([start, ...newRoute]) < totalDistance([start, ...best])
        ) {
          best = newRoute;
          improved = true;
        }
      }
    }
  }
  // Recalcule distances finales
  let fromLat = start.lat,
    fromLng = start.lng;
  return best.map((l) => {
    const distance = haversineDistance(fromLat, fromLng, l.lat, l.lng);
    fromLat = l.lat;
    fromLng = l.lng;
    return { ...l, distance };
  });
}

// ── Nearest Neighbor + 2-opt ──────────────────────────────────────────────────
export function nearestNeighbor(currentLat, currentLng, livraisons) {
  if (!livraisons || livraisons.length === 0) return [];
  const valid = livraisons.filter((l) => l.lat && l.lng);
  if (valid.length === 0) return [];
  const start = { lat: currentLat, lng: currentLng };
  const nn = nnBase(currentLat, currentLng, valid);
  if (nn.length <= 1) return nn;
  return twoOpt(start, nn);
}

// ── Géocodage Nominatim — avec fallback et retry ──────────────────────────────
export async function geocodeAddress(address) {
  if (!address) return null;

  // Nettoyage de l'adresse
  const cleaned = address.trim();

  // Tentative 1 : adresse complète
  const result = await _nominatimQuery(cleaned);
  if (result) return result;

  // Tentative 2 : sans les détails (enlève le premier segment avant la virgule)
  const parts = cleaned.split(",");
  if (parts.length > 1) {
    const shorter = parts.slice(1).join(",").trim();
    const result2 = await _nominatimQuery(shorter);
    if (result2) return result2;
  }

  // Tentative 3 : juste ville + pays
  if (parts.length > 2) {
    const cityCountry = parts.slice(-2).join(",").trim();
    const result3 = await _nominatimQuery(cityCountry);
    if (result3) return result3;
  }

  return null;
}

async function _nominatimQuery(address) {
  try {
    // Délai pour respecter le rate limit Nominatim (1 req/sec)
    await new Promise((r) => setTimeout(r, 300));

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=cm`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "fr",
        "User-Agent": "GloteholoDelivery/1.0",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }

    // Si pas de résultat avec countrycodes=cm, retry sans restriction pays
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          "Accept-Language": "fr",
          "User-Agent": "GloteholoDelivery/1.0",
        },
      },
    );
    if (!res2.ok) return null;
    const data2 = await res2.json();
    if (data2?.length > 0)
      return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };

    return null;
  } catch {
    return null;
  }
}

// ── Position GPS ──────────────────────────────────────────────────────────────
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

// ── Vrai itinéraire OSRM ──────────────────────────────────────────────────────
export async function getRealRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return [];

  try {
    const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`OSRM ${res.status}`);

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route");

    // GeoJSON: [lng, lat] → Leaflet: [lat, lng]
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (e) {
    console.warn("OSRM fallback (straight lines):", e.message);
    return waypoints.map((p) => [p.lat, p.lng]);
  }
}
