const moveReasonLabels = {
  purchase: 'Compra',
  sale: 'Venta',
  return: 'Devolución',
  exchange: 'Cambio',
  loss: 'Pérdida',
  damage: 'Daño',
  count: 'Conteo',
  correction: 'Corrección',
}

export function formatMoveReason(reason) {
  return moveReasonLabels[reason] ?? reason
}

const moveTypeLabels = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
}

export function formatMoveType(type) {
  return moveTypeLabels[type] ?? type
}
