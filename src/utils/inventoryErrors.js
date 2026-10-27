const INSUFFICIENT_PRIVILEGE = '42501'

export function getRegisterExitErrorMessage(
  error,
  fallback = 'No se pudo registrar la salida. Inténtalo nuevamente',
) {
  if (!error) {
    return fallback
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  const msg = error.message ?? ''

  if (msg.includes('administradores')) {
    return 'Solo un administrador puede registrar salidas de inventario'
  }

  if (msg.includes('La unidad no existe')) {
    return 'La unidad ya no existe'
  }

  if (msg.includes('no es válida para una salida')) {
    return 'El motivo seleccionado no es válido para una salida'
  }

  if (msg.includes('unidades disponibles')) {
    return 'Esta unidad ya no está disponible. Actualiza la lista e inténtalo de nuevo'
  }

  return fallback
}

export function getReactivateUnitErrorMessage(
  error,
  fallback = 'No se pudo reactivar la unidad. Inténtalo nuevamente',
) {
  if (!error) {
    return fallback
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  const msg = error.message ?? ''

  if (msg.includes('administradores')) {
    return 'Solo un administrador puede reactivar unidades'
  }

  if (msg.includes('La unidad no existe')) {
    return 'La unidad ya no existe'
  }

  if (msg.includes('reactivar unidades no disponibles')) {
    return 'Esta unidad ya está disponible. Actualiza la lista e inténtalo de nuevo'
  }

  return fallback
}

export function getRegisterCountErrorMessage(
  error,
  fallback = 'No se pudo registrar el conteo. Inténtalo nuevamente',
) {
  if (!error) {
    return fallback
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  const msg = error.message ?? ''

  if (msg.includes('administradores')) {
    return 'Solo un administrador puede registrar conteos físicos'
  }

  if (msg.includes('al menos una unidad faltante')) {
    return 'Debes marcar al menos una unidad como faltante'
  }

  if (msg.includes('Debe indicar') && msg.includes('unidades faltantes')) {
    return 'Debes indicar las unidades faltantes'
  }

  if (msg.includes('no existen')) {
    return 'Una o más unidades ya no existen. Actualiza la lista e inténtalo de nuevo'
  }

  if (msg.includes('ya no está disponible')) {
    return 'Al menos una unidad ya no está disponible. Actualiza la lista e inténtalo de nuevo'
  }

  return fallback
}
