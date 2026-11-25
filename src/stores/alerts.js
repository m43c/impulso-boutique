import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAlertsStore = defineStore('alerts', () => {
  const lowStockCount = ref(0)
  const lowStockProducts = ref([])
  const isLoading = ref(false)

  const returnedCount = ref(null)
  const isLoadingReturned = ref(false)
  const isReturnedAlertsEnabled = ref(false)

  const alertsTotal = computed(() => lowStockCount.value + (returnedCount.value ?? 0))

  let channel = null
  let returnedRefreshPending = false
  let returnedRequestId = 0

  async function fetchLowStockAlerts() {
    if (isLoading.value) {
      return
    }

    isLoading.value = true

    try {
      const { data: stockData, error: stockError } = await supabase
        .from('product_stock')
        .select('*')
        .eq('is_low_stock', true)
        .order('stock_available', { ascending: true })

      if (stockError) {
        throw stockError
      }

      if (!stockData || stockData.length === 0) {
        lowStockProducts.value = []
        lowStockCount.value = 0
        return
      }

      const productIds = stockData.map((s) => s.id)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, min_stock')
        .in('id', productIds)

      if (productsError) {
        throw productsError
      }

      const productsMap = new Map(productsData.map((p) => [p.id, p]))

      lowStockProducts.value = stockData.map((stock) => ({
        ...stock,
        product: productsMap.get(stock.id) || { name: 'Producto desconocido', min_stock: 0 },
      }))

      lowStockCount.value = lowStockProducts.value.length
    } catch (error) {
      console.error('Error al cargar alertas de stock:', error)
      lowStockProducts.value = []
      lowStockCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function fetchReturnedCount({ queueIfLoading = false } = {}) {
    if (!isReturnedAlertsEnabled.value) {
      return
    }

    if (isLoadingReturned.value) {
      if (queueIfLoading) {
        returnedRefreshPending = true
      }
      return
    }

    const requestId = ++returnedRequestId
    isLoadingReturned.value = true

    try {
      const { count, error } = await supabase
        .from('product_units')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'returned')

      if (error) {
        throw error
      }

      if (typeof count !== 'number') {
        throw new Error('No se pudo obtener el conteo de devoluciones')
      }

      if (requestId !== returnedRequestId || !isReturnedAlertsEnabled.value) {
        return
      }

      returnedCount.value = count
    } catch (error) {
      console.error('Error al cargar devoluciones por revisar:', error)
    } finally {
      if (requestId === returnedRequestId) {
        isLoadingReturned.value = false

        if (returnedRefreshPending) {
          returnedRefreshPending = false

          if (isReturnedAlertsEnabled.value) {
            fetchReturnedCount()
          }
        }
      }
    }
  }

  function setReturnedAlertsEnabled(enabled) {
    if (!enabled) {
      isReturnedAlertsEnabled.value = false
      returnedCount.value = null
      isLoadingReturned.value = false
      returnedRefreshPending = false
      returnedRequestId += 1
      return
    }

    if (isReturnedAlertsEnabled.value) {
      return
    }

    isReturnedAlertsEnabled.value = true
    returnedRequestId += 1
    returnedRefreshPending = false
    isLoadingReturned.value = false
  }

  function subscribeToStockChanges() {
    if (channel) {
      return
    }

    channel = supabase
      .channel('stock-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_units' }, () => {
        fetchLowStockAlerts()

        if (isReturnedAlertsEnabled.value) {
          fetchReturnedCount({ queueIfLoading: true })
        }
      })
      .subscribe()
  }

  function unsubscribeFromStockChanges() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  function clear() {
    lowStockProducts.value = []
    lowStockCount.value = 0
    returnedCount.value = null
    isReturnedAlertsEnabled.value = false
    isLoadingReturned.value = false
    returnedRefreshPending = false
    returnedRequestId += 1
    unsubscribeFromStockChanges()
  }

  return {
    lowStockCount,
    lowStockProducts,
    isLoading,
    returnedCount,
    isLoadingReturned,
    alertsTotal,
    fetchLowStockAlerts,
    fetchReturnedCount,
    setReturnedAlertsEnabled,
    subscribeToStockChanges,
    unsubscribeFromStockChanges,
    clear,
  }
})
