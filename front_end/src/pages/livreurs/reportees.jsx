import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  FiAlertCircle,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";

export default function LivraisonsReportees() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchReportees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/livraisons");
      const all = res.data?.livraisons || [];
      setLivraisons(
        all
          .filter((l) => l.status === "reportee")
          .sort(
            (a, b) =>
              new Date(a.date_livraison_prevue) -
              new Date(b.date_livraison_prevue),
          ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportees();
  }, []);

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  const isPast = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date() && !isToday(dateStr);
  };

  const urgenceCls = (dateStr) => {
    if (isPast(dateStr))
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    if (isToday(dateStr))
      return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
    return "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700";
  };

  {
    /* Légende */
  }
  <div className="flex flex-wrap gap-3 mb-5">
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <div className="w-3 h-3 rounded-full bg-red-400" />
      Date dépassée
    </div>
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <div className="w-3 h-3 rounded-full bg-orange-400" />
      Aujourd'hui
    </div>
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <div className="w-3 h-3 rounded-full bg-gray-300" />À venir
    </div>
    <button
      onClick={fetchReportees}
      className="ml-auto flex items-center gap-1.5 text-xs text-[#2563EB] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
    >
      <FiRefreshCw size={12} /> Actualiser
    </button>
  </div>;

  {
    loading ? (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700"
          />
        ))}
      </div>
    ) : livraisons.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <FiAlertCircle size={40} className="mb-3 opacity-30" />
        <p className="text-sm">Aucune livraison reportée</p>
      </div>
    ) : (
      <div className="space-y-3">
        {livraisons.map((liv) => {
          const commande = liv.commande;
          const past = isPast(liv.date_livraison_prevue);
          const today = isToday(liv.date_livraison_prevue);
          return (
            <div
              key={liv.id}
              onClick={() => navigate(`/admin/livraisons/${liv.id}`)}
              className={`rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-shadow ${urgenceCls(liv.date_livraison_prevue)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      past
                        ? "bg-red-100 text-red-600"
                        : today
                          ? "bg-orange-100 text-orange-600"
                          : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {(commande?.client_nom || liv.name || "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {commande?.client_nom || liv.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {commande?.source_id ? `${commande.source_id} · ` : ""}#
                      {liv.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {past && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
                      ⚠ Dépassée
                    </span>
                  )}
                  {today && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300">
                      Aujourd'hui
                    </span>
                  )}
                  {!past && !today && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                      Reportée
                    </span>
                  )}
                  <span className="text-xs text-gray-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-gray-600">
                    {liv.nb_reports || 0} report(s)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1.5">
                  <FiMapPin size={12} className="flex-shrink-0 text-gray-400" />
                  <span className="truncate">
                    {commande?.client_adresse || liv.adresse || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiUser size={12} className="flex-shrink-0 text-gray-400" />
                  <span>{liv.livreur?.name || "Non assigné"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiCalendar
                    size={12}
                    className="flex-shrink-0 text-gray-400"
                  />
                  <span
                    className={`font-semibold ${past ? "text-red-500" : today ? "text-orange-500" : "text-purple-600 dark:text-purple-300"}`}
                  >
                    {liv.date_livraison_prevue
                      ? new Date(liv.date_livraison_prevue).toLocaleString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Raison du report */}
              {liv.raison_report && (
                <div className="flex items-start gap-2 p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                  <FiAlertCircle
                    size={14}
                    className="text-purple-500 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {liv.raison_report}
                    </p>
                    {liv.note_report && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        "{liv.note_report}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
