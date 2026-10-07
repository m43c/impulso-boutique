export function getProductErrorMessage(error, fallback) {
  if (error?.code === '23505') {
    return 'Ya existe un producto idéntico y activo'
  }

  return fallback
}
