import api from './index'

export const masterApi = {
  // Kategori > subjenis > instansi penanganan, untuk dropdown form & filter.
  categories: () => api.get('/categories'),
}