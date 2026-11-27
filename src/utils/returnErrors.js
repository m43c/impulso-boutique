import { getSaleErrorMessage } from '@/utils/saleErrors'

const INSUFFICIENT_PRIVILEGE = '42501'
const INVALID_CODE = '22P02'
const AMBIGUOUS_CODE = 'S6008'

const RETURN_CODE_MESSAGES = {
  S7001: 'El plazo de 24 horas para devolver venció',
  S7002: 'Esta unidad ya fue devuelta',
  S7003: 'La unidad no está vendida',
  S7004: 'Una unidad recibida en un cambio solo puede cambiarse otra vez',
  S7005: 'La unidad de reemplazo no está disponible',
  S7006: 'El precio de la unidad de reemplazo no coincide con el precio pagado',
  S7007: 'La unidad de reemplazo es la misma que se devuelve',
  S7008: 'La unidad no está en revisión',
  S7009: 'La unidad de venta indicada no existe',
  S7010: 'Debe indicar el tipo y el motivo de la devolución',
  S7011: 'El reemplazo no corresponde al tipo de devolución',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getReturnErrorMessage(
  error,
  fallback = 'No se pudo registrar la devolución. Inténtalo nuevamente',
) {
  if (!error) {
    return fallback
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  if (RETURN_CODE_MESSAGES[error.code]) {
    return RETURN_CODE_MESSAGES[error.code]
  }

  return getSaleErrorMessage(error, fallback)
}

export function getReplacementErrorMessage(
  error,
  fallback = 'No se pudo agregar la unidad de reemplazo',
) {
  if (!error) {
    return fallback
  }

  if (error.code === AMBIGUOUS_CODE || error.code === INVALID_CODE) {
    return 'Usa los 8 caracteres o el UUID completo'
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  return getSaleErrorMessage(error, fallback)
}

export function getErrorUnitId(error) {
  const details = error?.details

  if (typeof details === 'string' && UUID_REGEX.test(details.trim())) {
    return details.trim()
  }

  return null
}
