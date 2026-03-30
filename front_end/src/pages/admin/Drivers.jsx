import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import { FiPlus, FiEdit2, FiTrash2, FiUser } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function AdminLivreurs() {
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

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
    setForm({ name: "", email: "", phone: "", password: "" });
    setError("");
    setShowModal(true);
  };
  const openEdit = (l) => {
    setEditItem(l);
    setForm({
      name: l.name,
      email: l.email,
      phone: l.phone || "",
      password: "",
    });
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
      if (editItem) await api.put(`/admin/livreurs/${editItem.id}`, form);
      else await api.post("/admin/livreurs", form);
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
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleToggleStatus = async (livreur) => {
    setToggling(livreur.id);
    try {
      const res = await api.put(`/admin/livreurs/${livreur.id}/toggle-status`);
      setLivreurs((prev) =>
        prev.map((l) =>
          l.id === livreur.id ? { ...l, status: res.data.status } : l,
        ),
      );
    } catch {
      alert("Erreur lors du changement de statut.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <AdminLayout
      title="Livreurs"
      subtitle={`${livreurs.length} livreur(s) au total`}
    >
      <div className="flex justify-end mb-5">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <FiPlus size={16} />
          <span className="hidden sm:inline">Creer un livreur</span>
          <span className="sm:hidden">Creer un livreur</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100"
            />
          ))}
        </div>
      ) : livreurs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <FiUser size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Aucun livreur trouvé</p>
        </div>
      ) : (
        <>
          {/* ── Vue tableau (desktop) ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Nom</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Téléphone</th>
                    <th className="text-left px-6 py-3">Statut</th>
                    <th className="text-left px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {livreurs.map((l) => {
                    const isActive = l.status === "active" || !l.status;
                    const isToggling = toggling === l.id;
                    return (
                      <tr
                        key={l.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? "bg-blue-100 text-[#2563EB]" : "bg-gray-100 text-gray-400"}`}
                            >
                              {l.name?.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={`text-sm font-medium ${isActive ? "text-gray-800" : "text-gray-400"}`}
                            >
                              {l.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {l.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {l.phone || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(l)}
                            disabled={isToggling}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${isActive ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                          >
                            {isToggling ? (
                              <AiOutlineLoading3Quarters
                                size={12}
                                className="animate-spin"
                              />
                            ) : (
                              <div
                                className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-400"}`}
                              />
                            )}
                            {isActive ? "Actif" : "Inactif"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(l)}
                              className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                            >
                              <FiEdit2 size={12} /> Éditer
                            </button>
                            <button
                              onClick={() => handleDelete(l.id)}
                              className="flex items-center gap-1.5 text-xs text-red-500 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                              <FiTrash2 size={12} /> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Vue cartes (mobile) ── */}
          <div className="md:hidden space-y-3">
            {livreurs.map((l) => {
              const isActive = l.status === "active" || !l.status;
              const isToggling = toggling === l.id;
              return (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isActive ? "bg-blue-100 text-[#2563EB]" : "bg-gray-100 text-gray-400"}`}
                      >
                        {l.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${isActive ? "text-gray-800" : "text-gray-400"}`}
                        >
                          {l.name}
                        </p>
                        <p className="text-xs text-gray-400">{l.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(l)}
                      disabled={isToggling}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}
                    >
                      {isToggling ? (
                        <AiOutlineLoading3Quarters
                          size={11}
                          className="animate-spin"
                        />
                      ) : (
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-400"}`}
                        />
                      )}
                      {isActive ? "Actif" : "Inactif"}
                    </button>
                  </div>

                  {l.phone && (
                    <p className="text-xs text-gray-400 mb-3 ml-1">{l.phone}</p>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => openEdit(l)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <FiEdit2 size={12} /> Éditer
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-500 border border-red-100 py-2 rounded-lg hover:bg-red-50 transition"
                    >
                      <FiTrash2 size={12} /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                {
                  label: "Nom complet",
                  key: "name",
                  type: "text",
                  placeholder: "Jean Dupont",
                  required: true,
                },
                {
                  label: "Email",
                  key: "email",
                  type: "email",
                  placeholder: "jean@gmail.com",
                  required: true,
                },
                {
                  label: "Téléphone",
                  key: "phone",
                  type: "tel",
                  placeholder: "6xx-xx-xx-xx",
                  required: false,
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm({ ...form, [field.key]: e.target.value })
                    }
                    required={field.required}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                  />
                </div>
              ))}
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
