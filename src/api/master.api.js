import api from './index'

export const masterApi = {
  // Kategori > subjenis > instansi penanganan, untuk dropdown form & filter.
  categories: () => api.get('/categories'),

  // Daftar kecamatan untuk filter. Sesuai district.routes.js di BE (publik: baca).
  districts: () => api.get('/districts'),
}