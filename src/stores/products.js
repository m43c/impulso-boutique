import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useProductsStore = defineStore('products', () => {
  const isCreating = ref(false)
  const products = ref([])

  async function createProduct(payload) {
    isCreating.value = true

    try {
      const { data, error } = await supabase.from('products').insert(payload).select().single()

      if (error) {
        throw error
      }

      return data
    } finally {
      isCreating.value = false
    }
  }

  function clear() {
    products.value = []
  }

  return {
    isCreating,
    products,
    createProduct,
    clear,
  }
})
