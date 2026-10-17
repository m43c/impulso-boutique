const unitStatusLabels = {
  available: 'Disponible',
  sold: 'Vendido',
  returned: 'Devuelto',
  unavailable: 'No disponible',
}

export function formatUnitStatus(status) {
  return unitStatusLabels[status] ?? status
}
