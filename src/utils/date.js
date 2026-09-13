export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
