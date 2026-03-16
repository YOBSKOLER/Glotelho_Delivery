import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

const statusConfig = {
  pending: { label: "En attente", cls: "bg-yellow-50 text-yellow-700" },
  assigned: { label: "Assignée", cls: "bg-blue-50 text-blue-700" },
  in_delivery: { label: "En livraison", cls: "bg-orange-50 text-orange-700" },
  delivered: { label: "Livrée", cls: "bg-green-50 text-green-700" },
};

export default function AdminLivraisons() {
  const [livraisons, setLivraisons] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLiv, setSelectedLiv] = useState(null);
  const [selectedLivreur, setSelectedLivreur] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [lRes, dRes] = await Promise.all([
        api.get("/admin/livraisons"),
        api.get("/admin/livreurs"),
      ]);
      setLivraisons(lRes.data?.livraisons || lRes.data || []);
      setLivreurs(dRes.data?.livreurs || dRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAssign = (liv) => {
    setSelectedLiv(liv);
    setSelectedLivreur("");
    setShowAssignModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/livraisons/assigner", {
        livraison_id: selectedLiv.id,
        livreur_id: selectedLivreur,
      });
      await fetchAll();
      setShowAssignModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'assignation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Livraisons"
      subtitle={`${livraisons.length} livraison(s) au total`}
    >
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : livraisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm">Aucune livraison trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Adresse</th>
                  <th className="text-left px-6 py-3">Livreur</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {livraisons.map((liv) => {
                  const st = statusConfig[liv.status] || {
                    label: liv.status,
                    cls: "bg-gray-50 text-gray-600",
                  };
                  return (
                    <tr
                      key={liv.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        #{liv.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {liv.client_name || liv.user?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[160px] truncate">
                        {liv.adresse_arrivee || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {liv.livreur?.name || (
                          <span className="text-gray-300 italic text-xs">
                            Non assigné
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {liv.created_at
                          ? new Date(liv.created_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {!liv.livreur && (
                          <button
                            onClick={() => openAssign(liv)}
                            className="flex items-center gap-1.5 text-xs text-[#2563EB] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                          >
                            Assigner
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal assignation */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                Assigner un livreur
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Livraison{" "}
              <span className="font-medium text-gray-800">
                #{selectedLiv?.id}
              </span>
            </p>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Choisir un livreur
                </label>
                <select
                  value={selectedLivreur}
                  onChange={(e) => setSelectedLivreur(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                >
                  <option value="">-- Sélectionner --</option>
                  {livreurs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-60"
                >
                  {saving ? "Assignation..." : "Assigner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
