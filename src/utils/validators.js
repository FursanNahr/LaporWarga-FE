// Cermin dari validators/auth.validator.js di BE (pesannya sengaja sama).
// Ini hanya untuk umpan balik cepat; BE tetap sumber kebenaran.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin({ email, password }) {
  const errors = {}
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Email tidak valid'
  if (!password) errors.password = 'Password wajib diisi'
  return errors
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {}
  const n = name.trim()
  if (n.length < 2) errors.name = 'Nama minimal 2 karakter'
  else if (n.length > 100) errors.name = 'Nama maksimal 100 karakter'
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Email tidak valid'
  if (password.length < 8) errors.password = 'Password minimal 8 karakter'
  else if (password.length > 72) errors.password = 'Password maksimal 72 karakter'
  if (confirmPassword !== password) errors.confirmPassword = 'Konfirmasi password tidak sama'
  return errors
}