import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiSave,
  FiEdit2,
  FiArrowLeft,
  FiLogOut,
} from "react-icons/fi";

export default function LivreurProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [infoForm, setInfoForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
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
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setInfoSuccess("Profil mis à jour !");
      setEditInfo(false);
    } catch (err) {
      setInfoError(err.response?.data?.message || "Erreur.");
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
      setPassSuccess("Mot de passe modifié !");
      setPassForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err) {
      setPassError(err.response?.data?.error || "Erreur.");
    } finally {
      setPassLoading(false);
    }
  };

  const fields = [
    {
      label: "Nom complet",
      key: "name",
      type: "text",
      icon: <FiUser size={14} />,
      placeholder: "Jean Dupont",
      required: true,
    },
    {
      label: "Email",
      key: "email",
      type: "email",
      icon: <FiMail size={14} />,
      placeholder: "jean@gmail.com",
      required: true,
    },
    {
      label: "Téléphone",
      key: "phone",
      type: "tel",
      icon: <FiPhone size={14} />,
      placeholder: "6xx-xx-xx-xx",
      required: false,
    },
  ];

  const passFields = [
    {
      label: "Mot de passe actuel",
      key: "current_password",
      toggleKey: "current",
    },
    { label: "Nouveau mot de passe", key: "password", toggleKey: "new" },
    { label: "Confirmer", key: "password_confirmation", toggleKey: "confirm" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-[#2563EB] px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/livreur/dashboard")}
          className="p-2 rounded-xl bg-blue-700 text-white"
        >
          <FiArrowLeft size={18} />
        </button>
        <p className="text-white font-semibold text-sm">Mon profil</p>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "L"}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{user?.name}</h2>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <span className="inline-flex mt-1.5 px-2.5 py-0.5 bg-blue-50 text-[#2563EB] text-xs font-semibold rounded-lg">
              Livreur
            </span>
          </div>
        </div>

        {/* Infos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Informations
            </h3>
            {!editInfo && (
              <button
                onClick={() => setEditInfo(true)}
                className="flex items-center gap-1 text-xs text-[#2563EB] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
              >
                <FiEdit2 size={11} /> Modifier
              </button>
            )}
          </div>
          {infoSuccess && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs">
              ✅ {infoSuccess}
            </div>
          )}
          {infoError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
              {infoError}
            </div>
          )}

          {editInfo ? (
            <form onSubmit={handleInfoSubmit} className="space-y-3">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {f.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {f.icon}
                    </span>
                    <input
                      type={f.type}
                      value={infoForm[f.key]}
                      onChange={(e) =>
                        setInfoForm({ ...infoForm, [f.key]: e.target.value })
                      }
                      required={f.required}
                      placeholder={f.placeholder}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditInfo(false);
                    setInfoError("");
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={infoLoading}
                  className="flex-1 bg-[#2563EB] text-white text-sm py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  <FiSave size={13} />
                  {infoLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {[
                { label: "Nom", value: user?.name, icon: <FiUser size={13} /> },
                {
                  label: "Email",
                  value: user?.email,
                  icon: <FiMail size={13} />,
                },
                {
                  label: "Téléphone",
                  value: user?.phone || "—",
                  icon: <FiPhone size={13} />,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
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

        {/* Mot de passe */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Changer le mot de passe
          </h3>
          {passSuccess && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs">
              ✅ {passSuccess}
            </div>
          )}
          {passError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
              {passError}
            </div>
          )}
          <form onSubmit={handlePassSubmit} className="space-y-3">
            {passFields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {f.label}
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type={showPass[f.toggleKey] ? "text" : "password"}
                    value={passForm[f.key]}
                    onChange={(e) =>
                      setPassForm({ ...passForm, [f.key]: e.target.value })
                    }
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPass((p) => ({
                        ...p,
                        [f.toggleKey]: !p[f.toggleKey],
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
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={passLoading}
              className="w-full bg-[#2563EB] text-white text-sm py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              <FiLock size={13} />
              {passLoading ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </form>
        </div>

        {/* Déconnexion */}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 font-semibold py-3.5 rounded-2xl border border-red-100 transition text-sm"
        >
          <FiLogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
