import axios from "axios";

// Configuration de base pour les requêtes API
const api = axios.create({
  baseURL: "http://localhost:8000/api", // Ajustez selon votre back-end Laravel
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json", 
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide, déconnexion
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
