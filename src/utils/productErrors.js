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

export function getRegisterEntryErrorMessage(
  error,
  fallback = 'No se pudieron registrar las unidades. Inténtalo nuevamente',
) {
  if (!error) {
    return fallback
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  const msg = error.message ?? ''

  if (msg.includes('administradores')) {
    return 'Solo un administrador puede registrar entradas de inventario'
  }
  if (msg.includes('no existe o está inactivo')) {
    return 'El producto no existe o está inactivo'
  }
  if (msg.includes('cantidad debe ser')) {
    return 'La cantidad debe ser al menos 1'
  }
  if (msg.includes('no es válida para registrar entrada')) {
    return 'El motivo seleccionado no es válido para registrar entradas'
  }

  return fallback
}
