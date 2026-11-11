const UNIQUE_VIOLATION = '23505'
const INSUFFICIENT_PRIVILEGE = '42501'
const NO_ROWS_RETURNED = 'PGRST116'

export function getSupplierErrorMessage(
  error,
  fallback = 'Ocurrió un error al procesar el proveedor',
) {
  if (!error) {
    return fallback
  }

  if (error.code === UNIQUE_VIOLATION) {
    return 'Ya existe un proveedor activo con ese nombre'
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  if (error.code === NO_ROWS_RETURNED) {
    return 'No se pudo completar la acción. Verifica tus permisos o que el proveedor aún exista'
  }

  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}
