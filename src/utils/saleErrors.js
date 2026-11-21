const INSUFFICIENT_PRIVILEGE = '42501'

const UNIT_STATUS_MESSAGES = {
  sold: 'La unidad ya fue vendida',
  returned: 'La unidad fue devuelta',
  unavailable: 'La unidad no está disponible',
}

export const SALE_MAX_UNITS = 50

export function getUnitAvailabilityMessage(status) {
  return UNIT_STATUS_MESSAGES[status] ?? 'La unidad no está disponible'
}

export function getSaleErrorMessage(
  error,
  fallback = 'No se pudo completar la venta. Inténtalo nuevamente',
) {
  if (!error) {
    return fallback
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    let msg = error.message.trim()

    const statusReplacements = {
      sold: 'vendida',
      returned: 'devuelta',
      unavailable: 'no disponible',
      available: 'disponible',
    }
    
    Object.entries(statusReplacements).forEach(([en, es]) => {
      msg = msg.replace(new RegExp(`\\b${en}\\b`, 'gi'), es)
    })

    return msg
  }

  return fallback
}
