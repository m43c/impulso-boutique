import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useSuppliersStore = defineStore('suppliers', () => {
  const isCreating = ref(false)
  const isFetching = ref(false)

  const suppliers = ref([])

  async function createSupplier(payload) {
    isCreating.value = true

    try {
      const { data, error } = await supabase.from('suppliers').insert(payload).select().single()

      if (error) {
        throw error
      }

      suppliers.value = [data, ...suppliers.value]

      return data
    } finally {
      isCreating.value = false
    }
  }

  async function fetchSuppliers() {
    isFetching.value = true

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      suppliers.value = data ?? []

      return suppliers.value
    } catch (error) {
      suppliers.value = []
      throw error
    } finally {
      isFetching.value = false
    }
  }

  function clear() {
    suppliers.value = []
  }

  return {
    isCreating,
    isFetching,
    suppliers,
    createSupplier,
    fetchSuppliers,
    clear,
  }
})
