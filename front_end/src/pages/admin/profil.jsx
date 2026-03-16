import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

export default function AdminProfile() {
  const { user } = useAuth();
  return (
    <AdminLayout title="Profil" subtitle="Vos informations">
      <div className="max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.name}
              </h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="inline-flex mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                Admin
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">Nom</span>
              <span className="font-medium text-gray-800">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">Email</span>
              <span className="font-medium text-gray-800">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Rôle</span>
              <span className="font-medium text-gray-800">Administrateur</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
