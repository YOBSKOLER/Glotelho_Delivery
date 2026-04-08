import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../../services/api";
import {
  FiArrowLeft,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCamera,
  FiEdit3,
  FiX,
} from "react-icons/fi";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Composant signature 
function SignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    hasDrawn.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = (e) => {
    e.preventDefault();
    drawing.current = false;
    if (hasDrawn.current) {
      onSave(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400">Signez dans la zone ci-dessus</p>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
        >
          <FiX size={11} /> Effacer
        </button>
      </div>
    </div>
  );
}

export default function DeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [livraison, setLivraison] = useState(null);
  const [loading, setLoading] = useState(true);

  // Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [reportHeure, setReportHeure] = useState("");
  const [reportRaison, setReportRaison] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);

  // Preuve de livraison
  const [showPreuveModal, setShowPreuveModal] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [terminating, setTerminating] = useState(false);
  const fileInputRef = useRef(null);

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

  //  Photo 
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Terminer avec preuve 
  const handleTerminer = async (e) => {
    e.preventDefault();
    if (!signature) {
      alert("La signature du client est obligatoire.");
      return;
    }
    setTerminating(true);
    try {
      await api.put(`/livreur/livraisons/${id}/terminer`, {
        preuve_photo: photo,
        preuve_signature: signature,
      });
      // Nettoie sessionStorage
      try {
        const saved = sessionStorage.getItem("livraisons_optimized");
        if (saved) {
          const optimized = JSON.parse(saved).filter(
            (l) => l.id !== parseInt(id),
          );
          sessionStorage.setItem(
            "livraisons_optimized",
            JSON.stringify(optimized),
          );
        }
      } catch { /* empty */ }
      navigate("/livreur/dashboard");
    } catch {
      alert("Erreur lors de la confirmation.");
    } finally {
      setTerminating(false);
    }
  };

  // ── Reporter ───────────────────────────────────────────────────────────────
  const handleReporter = async (e) => {
    e.preventDefault();
    if (!reportRaison.trim()) {
      alert("La raison du report est obligatoire.");
      return;
    }
    setReporting(true);
    try {
      await api.put(`/livreur/livraisons/${id}/reporter`, {
        date_livraison_prevue: `${reportDate}T${reportHeure}:00`,
        raison_report: reportRaison,
        note_report: reportNote,
      });
      setShowReportModal(false);
      navigate("/livreur/dashboard");
    } catch {
      alert("Erreur lors du report.");
    } finally {
      setReporting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full" />
      </div>
    );

  if (!livraison)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Livraison introuvable.</p>
      </div>
    );

  const commande = livraison.commande;
  const lat = commande?.latitude || livraison.latitude;
  const lng = commande?.longitude || livraison.longitude;
  const isFragile =
    Array.isArray(commande?.articles) &&
    commande.articles.some((a) => a.fragile);
  const articles = commande?.articles || [];
  const totalPrix = articles.reduce(
    (s, a) => s + (a.prix || 0) * (a.qty || 1),
    0,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#2563EB] px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-blue-700 text-white"
        >
          <FiArrowLeft size={18} />
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
        <div className="h-44">
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
        <div className="h-28 bg-blue-50 flex items-center justify-center">
          <p className="text-gray-400 text-sm">GPS non disponible</p>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Date prévue */}
        {livraison.date_livraison_prevue && (
          <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
            <FiClock size={18} className="text-[#2563EB] flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#2563EB]">
                Livraison planifiée
              </p>
              <p className="text-sm text-gray-700 font-medium">
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
          </div>
        )}

        {/* Raison du report */}
        {livraison.raison_report && (
          <div className="bg-purple-50 rounded-2xl p-4 flex items-start gap-3 border border-purple-100">
            <FiAlertCircle
              size={16}
              className="text-purple-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-xs font-semibold text-purple-700">
                Raison du report
              </p>
              <p className="text-sm text-purple-600">
                {livraison.raison_report}
              </p>
              {livraison.note_report && (
                <p className="text-xs text-purple-400 mt-0.5">
                  {livraison.note_report}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Infos client */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Client</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] font-bold text-sm flex-shrink-0">
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
              <FiMapPin
                size={14}
                className="text-gray-400 mt-0.5 flex-shrink-0"
              />
              <p className="text-sm text-gray-600">
                {commande?.client_adresse || livraison.adresse}
              </p>
            </div>
            {commande?.client_telephone && (
              <a
                href={`tel:${commande.client_telephone}`}
                className="flex items-center gap-2 w-full bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium justify-center"
              >
                <FiPhone size={16} /> Appeler le client
              </a>
            )}
          </div>
        </div>

        {/* Instructions */}
        {commande?.instructions_speciales && (
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
            <div className="flex items-start gap-2">
              <FiAlertCircle
                size={16}
                className="text-yellow-600 flex-shrink-0 mt-0.5"
              />
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
        {articles.length > 0 && (
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
              {articles.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-1 rounded-lg flex-shrink-0">
                      {a.qty}x
                    </span>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {a.nom}
                    </p>
                  </div>
                  {a.prix > 0 && (
                    <span className="text-xs font-semibold text-gray-600 flex-shrink-0 ml-2">
                      {(a.prix * a.qty).toLocaleString("fr-FR")} FCFA
                    </span>
                  )}
                </div>
              ))}
              {totalPrix > 0 && (
                <div className="flex justify-between pt-2 border-t border-gray-100">
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

      {/* Boutons action */}
      <div className="px-4 pb-10 space-y-3">
        {(livraison.status === "assigned" ||
          livraison.status === "in_delivery" ||
          livraison.status === "reportee") && (
          <>
            <button
              onClick={() => setShowPreuveModal(true)}
              className="w-full bg-[#10B981] hover:bg-green-600 text-white font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              <FiCheckCircle size={18} /> Confirmer la livraison
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold py-4 rounded-2xl border border-purple-200 transition flex items-center justify-center gap-2"
            >
              <FiClock size={18} /> Client absent — Reporter
            </button>
          </>
        )}

        {livraison.status === "delivered" && (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 font-semibold py-4 rounded-2xl text-center">
            Livraison terminée
          </div>
        )}
      </div>

      {/* ── Modal Preuve de livraison ── */}
      {showPreuveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Preuve de livraison
              </h2>
              <button
                onClick={() => setShowPreuveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleTerminer} className="space-y-5">
              {/* Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiCamera size={14} className="inline mr-1" /> Photo du colis
                  <span className="text-gray-400 font-normal ml-1">
                    (optionnel)
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhoto}
                  className="hidden"
                />
                {photo ? (
                  <div className="relative">
                    <img
                      src={photo}
                      alt="Preuve"
                      className="w-full h-40 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#2563EB] hover:text-[#2563EB] transition"
                  >
                    <FiCamera size={28} />
                    <span className="text-xs font-medium">
                      Prendre une photo
                    </span>
                  </button>
                )}
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiEdit3 size={14} className="inline mr-1" /> Signature du
                  client
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <SignaturePad
                  onSave={(data) => setSignature(data)}
                  onClear={() => setSignature(null)}
                />
                {signature && (
                  <div className="mt-2">
                    <img
                      src={signature}
                      alt="Signature"
                      className="h-16 border border-gray-100 rounded-lg bg-white p-1"
                    />
                    <p className="text-xs text-green-600 mt-1">
                      Signature enregistrée
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreuveModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={terminating || !signature}
                  className="flex-1 bg-[#10B981] hover:bg-green-600 text-white text-sm font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiCheckCircle size={16} />
                  {terminating ? "Confirmation..." : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Reporter ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Reporter la livraison
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400"
              >
                <FiX size={22} />
              </button>
            </div>

            <div className="bg-orange-50 rounded-xl p-3 mb-4 border border-orange-100">
              <p className="text-xs font-semibold text-orange-700">
                ⚠ Client absent
              </p>
              <p className="text-xs text-orange-500 mt-0.5">
                Cette information sera visible par l'administrateur
              </p>
            </div>

            <form onSubmit={handleReporter} className="space-y-4">
              {/* Raison obligatoire */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Raison du report <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    "Client absent",
                    "Adresse incorrecte",
                    "Colis endommagé",
                    "Autre",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReportRaison(r)}
                      className={`text-xs py-2 px-3 rounded-xl border transition ${
                        reportRaison === r
                          ? "bg-purple-100 border-purple-400 text-purple-700 font-semibold"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {reportRaison === "Autre" && (
                  <input
                    type="text"
                    placeholder="Précisez la raison..."
                    onChange={(e) => setReportRaison(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
                  />
                )}
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nouvelle date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Heure <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={reportHeure}
                    onChange={(e) => setReportHeure(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
                  />
                </div>
              </div>

              {/* Note optionnelle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Note complémentaire{" "}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Ex: Le voisin m'a dit que le client revient à 15h..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 resize-none"
                />
              </div>

              {reportDate && reportHeure && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <p className="text-xs text-purple-700 font-semibold">
                    📅 Nouveau RDV :{" "}
                    {new Date(`${reportDate}T${reportHeure}`).toLocaleString(
                      "fr-FR",
                      {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    reporting || !reportRaison || !reportDate || !reportHeure
                  }
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {reporting ? "Report..." : "Confirmer le report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
