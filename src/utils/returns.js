import { formatCurrency } from '@/utils/currency'

const RETURN_TYPE_LABELS = {
  refund: 'Reembolso',
  exchange: 'Cambio',
}

const RETURN_REASON_LABELS = {
  wrong_size: 'Talla incorrecta',
  wrong_color: 'Color incorrecto',
  defective: 'Defectuosa',
  not_as_expected: 'No era lo esperado',
  changed_mind: 'Cambió de opinión',
  wrong_item_delivered: 'Unidad equivocada',
  sale_error: 'Error de venta',
  other: 'Otro',
}

export const RETURN_REASONS = Object.entries(RETURN_REASON_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export function formatReturnType(type) {
  return RETURN_TYPE_LABELS[type] ?? type ?? '—'
}

export function formatReturnReason(reason) {
  return RETURN_REASON_LABELS[reason] ?? reason ?? '—'
}

export function countReturnedUnits(sale) {
  return (sale?.units ?? []).filter((unit) => !!unit.return_info).length
}

export function formatReturnedMarker(count) {
  return count
}

export function formatReturnedUnitsCount(count) {
  return `${count} ${count === 1 ? 'devuelta' : 'devueltas'}`
}

function formatRemainingTime(totalMinutes) {
  if (totalMinutes <= 0) {
    return 'menos de 1 min'
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) {
    return `${hours} h ${minutes} min`
  }

  if (hours > 0) {
    return `${hours} h`
  }

  return `${minutes} min`
}

export function formatReturnDeadline(returnableUntil, now = Date.now()) {
  if (!returnableUntil) {
    return null
  }

  const deadline = new Date(returnableUntil).getTime()

  if (Number.isNaN(deadline)) {
    return null
  }

  const diff = deadline - now

  if (diff > 0) {
    return `Quedan ${formatRemainingTime(Math.ceil(diff / 60000))}`
  }

  return `Plazo vencido hace ${formatRemainingTime(Math.floor(Math.abs(diff) / 60000))}`
}

export function formatReplacementSummary(unit) {
  if (!unit) {
    return 'la unidad de reemplazo'
  }

  const variant = [unit.color, unit.size].filter(Boolean).join(' · ')

  return variant || unit.productName || unit.product_name || 'la unidad de reemplazo'
}

function formatVariantSuffix(color, size) {
  const label = [color, size].filter(Boolean).join(' · ')
  return label ? ` · ${label}` : ''
}

export function formatReturnReplacement(returnInfo) {
  if (!returnInfo?.replacement_product_name) {
    return null
  }

  const code = returnInfo.replacement_unit_code ? ` (${returnInfo.replacement_unit_code})` : ''
  const variant = formatVariantSuffix(returnInfo.replacement_color, returnInfo.replacement_size)

  return `Por: ${returnInfo.replacement_product_name}${variant}${code}`
}

export function formatReplacedUnit(replacedInfo) {
  if (!replacedInfo?.product_name) {
    return null
  }

  const code = replacedInfo.unit_code ? ` (${replacedInfo.unit_code})` : ''
  const variant = formatVariantSuffix(replacedInfo.color, replacedInfo.size)

  return `Cambio de: ${replacedInfo.product_name}${variant}${code}`
}

export function buildReturnSuccessMessage({ type, refundAmount, refundMethod, replacement } = {}) {
  if (type === 'exchange') {
    return `Cambio registrado. Entrega la unidad de reemplazo (${formatReplacementSummary(replacement)}). La devuelta quedó en revisión.`
  }

  const amount = formatCurrency(refundAmount ?? 0)

  if (refundMethod === 'qr_transfer') {
    return `Reembolso registrado. Devuelve ${amount} por transferencia QR (hazla a mano en tu banco). La unidad quedó en revisión.`
  }

  return `Reembolso registrado. Devuelve ${amount} en efectivo. La unidad quedó en revisión.`
}
