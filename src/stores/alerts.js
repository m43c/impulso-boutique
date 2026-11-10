import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAlertsStore = defineStore('alerts', () => {
  const lowStockCount = ref(0)
  const lowStockProducts = ref([])
  const isLoading = ref(false)

  let channel = null

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

  function subscribeToStockChanges() {
    if (channel) {
      return
    }

    channel = supabase
      .channel('stock-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_units' }, () => {
        fetchLowStockAlerts()
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
    unsubscribeFromStockChanges()
  }

  return {
    lowStockCount,
    lowStockProducts,
    isLoading,
    fetchLowStockAlerts,
    subscribeToStockChanges,
    unsubscribeFromStockChanges,
    clear,
  }
})
