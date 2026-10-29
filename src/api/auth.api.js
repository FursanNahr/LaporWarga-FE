import api from './index'

// Prefix /auth berasal dari BE: router.use('/auth', authRoutes).
// baseURL (.env) sudah berisi /api, jadi URL akhirnya /api/auth/...
export const authApi = {
  register: (payload) => api.post('/auth/register', payload), // { name, email, password }
  login: (payload) => api.post('/auth/login', payload),       // { email, password }
  me: () => api.get('/auth/me'),                              // butuh token
}