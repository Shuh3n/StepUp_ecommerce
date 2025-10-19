// Mapea mensajes de error de autenticación a textos en español amigables
export function translateAuthError(raw: string): string {
  if (!raw) return '';
  const r = raw.toLowerCase();
  // Mensajes comunes de Supabase/Auth
  if (r.includes('invalid login credentials') || r.includes('invalid login')) {
    return 'Credenciales inválidas. Verifica tu correo y contraseña.';
  }
  if (r.includes('invalid password')) return 'Contraseña incorrecta.';
  if (r.includes('user not found') || r.includes('no user')) return 'Usuario no encontrado.';
  if (r.includes('email not confirmed') || r.includes('email not verified')) return 'Email no verificado. Revisa tu correo.';
  if (r.includes('invalid oauth provider') || r.includes('invalid provider')) return 'Proveedor de OAuth inválido.';
  if (r.includes('account already exists') || r.includes('already registered') || r.includes('user_exists')) return 'Esta cuenta ya existe.';
  if (r.includes('network')) return 'Error de red. Verifica tu conexión e intenta nuevamente.';
  // Si no coincidió, devolver el mensaje original para facilitar debugging.
  return raw;
}
