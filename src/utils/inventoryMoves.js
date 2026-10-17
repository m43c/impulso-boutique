const moveReasonLabels = {
  purchase: 'Compra',
  sale: 'Venta',
  return: 'Devolución',
  exchange: 'Cambio',
  loss: 'Pérdida',
  damage: 'Daño',
  count: 'Conteo',
  correction: 'Ajuste',
}

export function formatMoveReason(reason) {
  return moveReasonLabels[reason] ?? reason
}
