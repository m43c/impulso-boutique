import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import {
  getErrorUnitId,
  getReplacementErrorMessage,
  getReturnErrorMessage,
} from '@/utils/returnErrors'

function normalizeReplacementUnit(row) {
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

export const useReturnsStore = defineStore('returns', () => {
  const isRegistering = ref(false)
  const isResolvingReplacement = ref(false)
  const isLoadingUnitSale = ref(false)
  const isLoadingReturnedUnits = ref(false)
  const isReviewing = ref(false)

  async function resolveReplacement(code) {
    const trimmed = (code ?? '').trim()

    if (!trimmed) {
      return { ok: false, message: 'Ingresa un código' }
    }

    if (isResolvingReplacement.value) {
      return { ok: false, message: 'Espera a que termine la búsqueda anterior' }
    }

    isResolvingReplacement.value = true

    try {
      const { data, error } = await supabase.rpc('resolve_unit_code', { p_code: trimmed })

      if (error) {
        throw error
      }

      const rows = Array.isArray(data) ? data : data ? [data] : []

      if (rows.length === 0) {
        return { ok: false, message: 'No se encontró la unidad' }
      }

      return { ok: true, unit: normalizeReplacementUnit(rows[0]) }
    } catch (error) {
      return {
        ok: false,
        message: getReplacementErrorMessage(error),
        code: error?.code,
      }
    } finally {
      isResolvingReplacement.value = false
    }
  }

  async function registerReturn({
    saleDetailId,
    type,
    reason,
    note = null,
    replacementUnitId = null,
  } = {}) {
    if (isRegistering.value) {
      return { ok: false, message: 'Espera a que termine el registro anterior' }
    }

    isRegistering.value = true

    try {
      const { data, error } = await supabase.rpc('register_return', {
        p_sale_detail_id: saleDetailId,
        p_type: type,
        p_reason: reason,
        p_note: note?.trim() ? note.trim() : null,
        p_replacement_unit_id: replacementUnitId,
      })

      if (error) {
        throw error
      }

      const row = Array.isArray(data) ? data[0] : data

      return {
        ok: true,
        returnId: row?.return_id ?? null,
        refundAmount: Number(row?.refund_amount ?? 0),
        refundMethod: row?.refund_method ?? null,
      }
    } catch (error) {
      return {
        ok: false,
        message: getReturnErrorMessage(error),
        code: error?.code,
        unitId: getErrorUnitId(error),
      }
    } finally {
      isRegistering.value = false
    }
  }

  async function fetchUnitSale(unitId) {
    if (!unitId) {
      return { ok: false, message: 'La unidad no es válida' }
    }

    isLoadingUnitSale.value = true

    try {
      const { data, error } = await supabase.rpc('get_unit_sale', { p_unit_id: unitId })

      if (error) {
        throw error
      }

      const rows = Array.isArray(data) ? data : data ? [data] : []

      return { ok: true, sale: rows[0] ?? null }
    } catch (error) {
      return {
        ok: false,
        message: getReturnErrorMessage(
          error,
          'No se pudo consultar la venta de la unidad. Inténtalo nuevamente',
        ),
        code: error?.code,
      }
    } finally {
      isLoadingUnitSale.value = false
    }
  }

  async function fetchReturnedUnits() {
    isLoadingReturnedUnits.value = true

    try {
      const { data, error } = await supabase.rpc('get_returned_units')

      if (error) {
        throw error
      }

      return { ok: true, units: data ?? [] }
    } catch (error) {
      return {
        ok: false,
        message: getReturnErrorMessage(
          error,
          'No se pudieron cargar las devoluciones. Inténtalo nuevamente',
        ),
        code: error?.code,
      }
    } finally {
      isLoadingReturnedUnits.value = false
    }
  }

  async function reviewReturnedUnit({ unitId, approve, note = null } = {}) {
    if (isReviewing.value) {
      return { ok: false, message: 'Espera a que termine la revisión anterior' }
    }

    isReviewing.value = true

    try {
      const { error } = await supabase.rpc('review_returned_unit', {
        p_unit_id: unitId,
        p_approve: approve,
        p_note: note?.trim() ? note.trim() : null,
      })

      if (error) {
        throw error
      }

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: getReturnErrorMessage(
          error,
          'No se pudo revisar la devolución. Inténtalo nuevamente',
        ),
        code: error?.code,
        unitId: getErrorUnitId(error),
      }
    } finally {
      isReviewing.value = false
    }
  }

  return {
    isRegistering,
    isResolvingReplacement,
    isLoadingUnitSale,
    isLoadingReturnedUnits,
    isReviewing,
    resolveReplacement,
    registerReturn,
    fetchUnitSale,
    fetchReturnedUnits,
    reviewReturnedUnit,
  }
})
