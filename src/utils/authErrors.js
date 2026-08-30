import { isAuthApiError } from '@supabase/supabase-js'

const errorMessages = {
  invalid_credentials: 'Correo electrónico o contraseña incorrectos',
  user_not_found: 'Correo electrónico o contraseña incorrectos',
  user_banned: 'Cuenta suspendida. Contacta al administrador',
  over_request_rate_limit: 'Demasiados intentos. Inténtalo mas tarde',
  validation_failed: 'Los datos ingresados no son válidos',
}

const fallbackMessage = 'Error al iniciar sesión. Inténtalo de nuevo'
const networkErrorMessage = 'Sin conexión a internet. Intentélo de nuevo'

export function getAuthErrorMessage(error) {
  if (!error) {
    return fallbackMessage
  }

  if (!isAuthApiError(error)) {
    return networkErrorMessage
  }

  return errorMessages[error.code] ?? fallbackMessage
}
