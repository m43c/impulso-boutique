import { formatCurrency } from '@/utils/currency'

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

export function formatSaleTotal(totalAmount) {
  // const total = Number(totalAmount ?? 0)
  // return total > 0 ? formatCurrency(total) : '—'

  return formatCurrency(Number(totalAmount ?? 0))
}

export function formatItemsCount(itemsCount) {
  const count = Number(itemsCount ?? 0)
  return `${count} ${count === 1 ? 'unidad' : 'unidades'}`
}
