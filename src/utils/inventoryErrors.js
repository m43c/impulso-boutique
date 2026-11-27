const INSUFFICIENT_PRIVILEGE = '42501'
const UNIQUE_VIOLATION = '23505'
const NO_ROWS_RETURNED = 'PGRST116'

const STATUS_LABELS = {
  sold: 'vendida',
  returned: 'devuelta',
  unavailable: 'no disponible',
  available: 'disponible',
}

function translateStatuses(message) {
  return message.replace(
    /\b(sold|returned|unavailable|available)\b/gi,
    (match) => STATUS_LABELS[match.toLowerCase()] ?? match,
  )
}

function resolveError(error, fallback) {
  if (!error) {
    return fallback
  }

  switch (error.code) {
    case INSUFFICIENT_PRIVILEGE:
      return 'No tienes permisos para realizar esta acción'
    case UNIQUE_VIOLATION:
      return 'Ya existe un registro con esos datos'
    case NO_ROWS_RETURNED:
      return 'No se pudo completar la acción. Actualiza la lista e inténtalo de nuevo'
  }

  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    return translateStatuses(error.message)
  }

  return fallback
}

export function getRegisterEntryErrorMessage(
  error,
  fallback = 'No se pudieron registrar las unidades. Inténtalo nuevamente',
) {
  return resolveError(error, fallback)
}

export function getRegisterExitErrorMessage(
  error,
  fallback = 'No se pudo registrar la salida. Inténtalo nuevamente',
) {
  return resolveError(error, fallback)
}

export function getReactivateUnitErrorMessage(
  error,
  fallback = 'No se pudo reactivar la unidad. Inténtalo nuevamente',
) {
  return resolveError(error, fallback)
}

export function getRegisterCountErrorMessage(
  error,
  fallback = 'No se pudo registrar el conteo. Inténtalo nuevamente',
) {
  return resolveError(error, fallback)
}
