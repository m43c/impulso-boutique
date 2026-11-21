const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  qr_transfer: 'Transferencia QR',
}

export function shortId(id) {
  const value = String(id ?? '').trim()
  return value ? value.slice(0, 8) : '—'
}

export function formatPaymentMethod(paymentMethod) {
  if (!paymentMethod) {
    return 'Cambio'
  }

  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod
}
