import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

export default function Drivers() {
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLivreurs = async () => {
    try {
      const res = await api.get("/admin/livreurs");
      setLivreurs(res.data?.livreurs || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivreurs();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", email: "", password: "" });
    setError("");
    setShowModal(true);
  };
  const openEdit = (l) => {
    setEditItem(l);
    setForm({ name: l.name, email: l.email, password: "" });
    setError("");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editItem) {
        await api.put(`/admin/livreurs/${editItem.id}`, form);
      } else {
        await api.post("/admin/livreurs", form);
      }
      await fetchLivreurs();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce livreur ?")) return;
    try {
      await api.delete(`/admin/livreurs/${id}`);
      setLivreurs((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <AdminLayout
      title="Livreurs"
      subtitle={`${livreurs.length} livreur(s) au total`}
    >
      {/* Header action */}
      <div className="flex justify-end mb-5">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm shadow-blue-100"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Ajouter un livreur
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : livreurs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="mb-3 opacity-40"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm">Aucun livreur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Nom</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {livreurs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] text-xs font-bold flex-shrink-0">
                          {l.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {l.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {l.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700">
                        Actif
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(l)}
                          className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                          <svg
                            width="13"
                            height="13"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="flex items-center gap-1.5 text-xs text-red-500 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                        >
                          <svg
                            width="13"
                            height="13"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                {editItem ? "Modifier le livreur" : "Ajouter un livreur"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="jean@gmail.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Mot de passe{" "}
                  {editItem && (
                    <span className="text-gray-400 font-normal">
                      (laisser vide = inchangé)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editItem}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-60"
                >
                  {saving
                    ? "Enregistrement..."
                    : editItem
                      ? "Modifier"
                      : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
