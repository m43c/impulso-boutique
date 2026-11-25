const unitStatusLabels = {
  available: 'Disponible',
  sold: 'Vendida',
  returned: 'Devuelta',
  unavailable: 'No disponible',
}

export function formatUnitStatus(status) {
  return unitStatusLabels[status] ?? status
}
