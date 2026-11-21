import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { getSaleErrorMessage, getUnitAvailabilityMessage, SALE_MAX_UNITS } from '@/utils/saleErrors'

const PAYMENT_METHODS = ['cash', 'qr_transfer']

function normalizeUnit(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    productId: row.product_id ?? null,
    productName: row.product_name ?? '',
    imagePublicId: row.image_public_id ?? null,
    color: row.color ?? null,
    size: row.size ?? null,
    price: Number(row.price ?? 0),
    status: row.status ?? null,
    isActive: row.is_active ?? true,
  }
}

export const useSaleStore = defineStore('sale', () => {
  const items = ref([])
  const paymentMethod = ref(null)
  const isResolving = ref(false)
  const isConfirming = ref(false)
  const lastSale = ref(null)
  const failedUnitId = ref(null)

  const count = computed(() => items.value.length)
  const total = computed(() => items.value.reduce((sum, item) => sum + Number(item.price ?? 0), 0))
  const canConfirm = computed(
    () =>
      items.value.length > 0 &&
      items.value.length <= SALE_MAX_UNITS &&
      PAYMENT_METHODS.includes(paymentMethod.value) &&
      !isConfirming.value,
  )

  function hasUnit(id) {
    return items.value.some((item) => item.id === id)
  }

  function addUnit(unit) {
    if (!unit?.id) {
      return { ok: false, code: 'S6004', message: 'La unidad no existe' }
    }

    if (hasUnit(unit.id)) {
      return { ok: false, code: 'DUPLICATE', message: 'La unidad ya está en la venta' }
    }

    if (unit.status && unit.status !== 'available') {
      return { ok: false, code: 'S6005', message: getUnitAvailabilityMessage(unit.status) }
    }

    if (unit.isActive === false) {
      return { ok: false, code: 'S6006', message: 'Producto retirado: no se puede vender' }
    }

    if (!(Number(unit.price) > 0)) {
      return { ok: false, code: 'S6007', message: 'Producto sin precio válido' }
    }

    if (items.value.length >= SALE_MAX_UNITS) {
      return { ok: false, code: 'S6002', message: `Máximo ${SALE_MAX_UNITS} prendas por venta` }
    }

    items.value.push(unit)
    return { ok: true, unit }
  }

  async function addUnitByCode(code) {
    const trimmed = (code ?? '').trim()

    if (!trimmed) {
      return { ok: false, message: 'Ingresa un código' }
    }

    if (isResolving.value) {
      return { ok: false, message: 'Espera a que termine la búsqueda anterior' }
    }

    isResolving.value = true

    try {
      const { data, error } = await supabase.rpc('resolve_unit_code', { p_code: trimmed })

      if (error) {
        throw error
      }

      const rows = Array.isArray(data) ? data : data ? [data] : []

      if (rows.length === 0) {
        return { ok: false, message: 'No se encontró la unidad' }
      }

      return addUnit(normalizeUnit(rows[0]))
    } catch (error) {
      return {
        ok: false,
        message: getSaleErrorMessage(error, 'No se pudo agregar la prenda'),
        code: error?.code,
      }
    } finally {
      isResolving.value = false
    }
  }

  function removeUnit(id) {
    items.value = items.value.filter((item) => item.id !== id)

    if (failedUnitId.value === id) {
      failedUnitId.value = null
    }
  }

  function setPaymentMethod(method) {
    paymentMethod.value = PAYMENT_METHODS.includes(method) ? method : null
  }

  function clear() {
    items.value = []
    paymentMethod.value = null
    isResolving.value = false
    isConfirming.value = false
    lastSale.value = null
    failedUnitId.value = null
  }

  function clearLastSale() {
    lastSale.value = null
    failedUnitId.value = null
  }

  async function confirmSale() {
    if (!canConfirm.value) {
      return { ok: false, message: 'La venta no está lista para confirmar' }
    }

    isConfirming.value = true
    failedUnitId.value = null

    const itemsCount = items.value.length
    const method = paymentMethod.value

    try {
      const { data, error } = await supabase.rpc('register_sale', {
        p_unit_ids: items.value.map((item) => item.id),
        p_payment_method: method,
      })

      if (error) {
        throw error
      }

      const row = Array.isArray(data) ? data[0] : data

      lastSale.value = {
        id: row?.sale_id ?? row?.id,
        totalAmount: Number(row?.total_amount ?? 0),
        itemsCount,
        paymentMethod: method,
      }

      items.value = []
      paymentMethod.value = null

      return { ok: true, sale: lastSale.value }
    } catch (error) {
      failedUnitId.value = error?.details ?? null

      return {
        ok: false,
        message: getSaleErrorMessage(error),
        code: error?.code,
      }
    } finally {
      isConfirming.value = false
    }
  }

  return {
    items,
    paymentMethod,
    isResolving,
    isConfirming,
    lastSale,
    failedUnitId,
    count,
    total,
    canConfirm,
    hasUnit,
    addUnit,
    addUnitByCode,
    removeUnit,
    setPaymentMethod,
    clear,
    clearLastSale,
    confirmSale,
  }
})
