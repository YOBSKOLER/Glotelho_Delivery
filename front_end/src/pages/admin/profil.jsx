import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiSave,
  FiEdit2,
} from "react-icons/fi";

export default function AdminProfile() {
  const { user, login } = useAuth();

  const [infoForm, setInfoForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passForm, setPassForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [infoLoading, setInfoLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [infoError, setInfoError] = useState("");
  const [passError, setPassError] = useState("");
  const [editInfo, setEditInfo] = useState(false);
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoError("");
    setInfoSuccess("");
    try {
      const res = await api.put("/profile/update", infoForm);
      // Met à jour le localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setInfoSuccess("Profil mis à jour avec succès !");
      setEditInfo(false);
    } catch (err) {
      setInfoError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur lors de la mise à jour.",
      );
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passForm.password !== passForm.password_confirmation) {
      setPassError("Les mots de passe ne correspondent pas.");
      return;
    }
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");
    try {
      await api.put("/profile/password", passForm);
      setPassSuccess("Mot de passe modifié avec succès !");
      setPassForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err) {
      setPassError(err.response?.data?.error || "Erreur lors du changement.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Mon profil"
      subtitle="Gérez vos informations personnelles"
    >
      <div className="max-w-2xl space-y-6">
        {/* ── Avatar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className="inline-flex mt-2 px-2.5 py-0.5 bg-blue-50 text-[#2563EB] text-xs font-semibold rounded-lg">
              Administrateur
            </span>
          </div>
        </div>

        {/* ── Infos personnelles ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-800">
              Informations personnelles
            </h3>
            {!editInfo && (
              <button
                onClick={() => setEditInfo(true)}
                className="flex items-center gap-1.5 text-xs text-[#2563EB] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
              >
                <FiEdit2 size={12} /> Modifier
              </button>
            )}
          </div>

          {infoSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              ✅ {infoSuccess}
            </div>
          )}
          {infoError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {infoError}
            </div>
          )}

          {editInfo ? (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nom complet
                </label>
                <div className="relative">
                  <FiUser
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={15}
                  />
                  <input
                    type="text"
                    value={infoForm.name}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, name: e.target.value })
                    }
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={15}
                  />
                  <input
                    type="email"
                    value={infoForm.email}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, email: e.target.value })
                    }
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Téléphone
                </label>
                <div className="relative">
                  <FiPhone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={15}
                  />
                  <input
                    type="tel"
                    value={infoForm.phone}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, phone: e.target.value })
                    }
                    placeholder="6xx-xx-xx-xx"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditInfo(false);
                    setInfoError("");
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={infoLoading}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <FiSave size={14} />
                  {infoLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Nom", value: user?.name, icon: <FiUser size={14} /> },
                {
                  label: "Email",
                  value: user?.email,
                  icon: <FiMail size={14} />,
                },
                
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2 text-gray-400">
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Mot de passe ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">
            Changer le mot de passe
          </h3>

          {passSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              ✅ {passSuccess}
            </div>
          )}
          {passError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {passError}
            </div>
          )}

          <form onSubmit={handlePassSubmit} className="space-y-4">
            {[
              {
                label: "Mot de passe actuel",
                key: "current_password",
                show: showPass.current,
                toggleKey: "current",
              },
              {
                label: "Nouveau mot de passe",
                key: "password",
                show: showPass.new,
                toggleKey: "new",
              },
              {
                label: "Confirmer mot de passe",
                key: "password_confirmation",
                show: showPass.confirm,
                toggleKey: "confirm",
              },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {field.label}
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={15}
                  />
                  <input
                    type={field.show ? "text" : "password"}
                    value={passForm[field.key]}
                    onChange={(e) =>
                      setPassForm({ ...passForm, [field.key]: e.target.value })
                    }
                    required
                    placeholder="••••••••"
                    minLength={field.key !== "current_password" ? 6 : undefined}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPass((prev) => ({
                        ...prev,
                        [field.toggleKey]: !prev[field.toggleKey],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {field.show ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      ) : (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={passLoading}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <FiLock size={14} />
              {passLoading ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
