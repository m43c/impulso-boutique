const UNIQUE_VIOLATION = '23505'
const INSUFFICIENT_PRIVILEGE = '42501'
const NO_ROWS_RETURNED = 'PGRST116'

export function getProductErrorMessage(error, fallback) {
  if (error?.code === UNIQUE_VIOLATION) {
    return 'Ya existe un producto idéntico y activo'
  }

  if (error?.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  if (error?.code === NO_ROWS_RETURNED) {
    return 'No se pudo completar la acción. Verifica tus permisos o que el producto aún exista'
  }

  return fallback
}
