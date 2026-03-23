import api from "./api";

const livreurService = {
  // GET /api/livreur/livraisons
  getMesLivraisons: async () => {
    const res = await api.get("/livreur/livraisons");
    return res.data?.livraisons || res.data || [];
  },

  // PUT /api/livreur/livraisons/{id}/demarrer
  demarrer: async (id) => {
    const res = await api.put(`/livreur/livraisons/${id}/demarrer`);
    return res.data;
  },

  // PUT /api/livreur/livraisons/{id}/terminer
  terminer: async (id) => {
    const res = await api.put(`/livreur/livraisons/${id}/terminer`);
    return res.data;
  },

  // GET historique (livraisons livrées)
  getHistorique: async () => {
    const res = await api.get("/livreur/historique");
    return res.data?.livraisons || res.data || [];
  },
};

export default livreurService;
