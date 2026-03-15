import api from './api';

const authService = {

  // POST /api/login
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    const { token, user, role } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);
    return response.data;
  },

  // POST /api/forgot-password
  forgotPassword: async (email) => {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  // POST /api/reset-password
  resetPassword: async (email, token, password, password_confirmation) => {
    const response = await api.post('/reset-password', {
      email,
      token,
      password,
      password_confirmation,
    });
    return response.data;
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = '/login';
  },

  // Récupérer l'utilisateur connecté
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Récupérer le rôle
  getRole: () => localStorage.getItem('role'),

  // Vérifier si connecté
  isAuthenticated: () => !!localStorage.getItem('token'),
};

export default authService;
