const UNIQUE_VIOLATION = '23505'
const INSUFFICIENT_PRIVILEGE = '42501'
const NO_ROWS_RETURNED = 'PGRST116'

export function getProductErrorMessage(
  error,
  fallback = 'Ocurrió un error al procesar el producto',
) {
  if (!error) {
    return fallback
  }

  if (error.code === UNIQUE_VIOLATION) {
    const detail = error.detail || error.message || ''

    if (detail.includes('products_variant_group_color_size_uq')) {
      return 'Ya existe una variante con ese color y talla'
    }
    
    return 'Ya existe un producto idéntico y activo'
  }

  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return 'No tienes permisos para realizar esta acción'
  }

  if (error.code === NO_ROWS_RETURNED) {
    return 'No se pudo completar la acción. Verifica tus permisos o que el producto aún exista'
  }

  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}
