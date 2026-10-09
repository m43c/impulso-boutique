export function formatCurrency(value) {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return '—'
  }

  return `Bs. ${number.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
