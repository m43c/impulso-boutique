import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useSuppliersStore = defineStore('suppliers', () => {
  const isCreating = ref(false)
  const isFetching = ref(false)
  const isUpdating = ref(false)
  const isTogglingStatus = ref(false)

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

  async function updateSupplier(id, payload) {
    isUpdating.value = true

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      suppliers.value = suppliers.value.map((supplier) => (supplier.id === id ? data : supplier))

      return data
    } finally {
      isUpdating.value = false
    }
  }

  async function toggleSupplierStatus(supplier) {
    isTogglingStatus.value = true

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ is_active: !supplier.is_active })
        .eq('id', supplier.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      suppliers.value = suppliers.value.map((item) => (item.id === supplier.id ? data : item))

      return data
    } finally {
      isTogglingStatus.value = false
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
    isUpdating,
    isTogglingStatus,
    suppliers,
    createSupplier,
    updateSupplier,
    toggleSupplierStatus,
    fetchSuppliers,
    clear,
  }
})
