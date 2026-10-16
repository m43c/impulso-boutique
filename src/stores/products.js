import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/services/cloudinary'

export const useProductsStore = defineStore('products', () => {
  const isCreating = ref(false)
  const isFetching = ref(false)
  const isUpdating = ref(false)
  const isLoadingUnitStats = ref(false)
  const isRegisteringEntry = ref(false)

  const products = ref([])
  const options = ref({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
  })
  const unitStats = ref({
    available: 0,
    sold: 0,
    returned: 0,
    unavailable: 0,
    total: 0,
  })

  async function createProduct(payload, imageFile) {
    isCreating.value = true

    try {
      let publicId = null

      if (imageFile) {
        const result = await uploadImage(imageFile)
        publicId = result.public_id
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...payload,
          image_public_id: publicId,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } finally {
      isCreating.value = false
    }
  }

  async function fetchProducts() {
    isFetching.value = true

    try {
      const { data, error } = await supabase
        .from('products')
        .select()
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      products.value = data
      return data
    } catch (error) {
      products.value = []
      throw error
    } finally {
      isFetching.value = false
    }
  }

  async function fetchProductById(id) {
    const { data, error } = await supabase.from('products').select().eq('id', id).single()

    if (error) {
      throw error
    }

    return data
  }

  async function fetchOptions() {
    const { data, error } = await supabase.rpc('get_product_options')

    if (error) {
      throw error
    }

    options.value = {
      categories: data?.categories ?? [],
      brands: data?.brands ?? [],
      colors: data?.colors ?? [],
      sizes: data?.sizes ?? [],
    }

    return options.value
  }

  async function updateProduct(payload, imageFile) {
    isUpdating.value = true

    try {
      const updateData = { ...payload }

      if (imageFile) {
        const result = await uploadImage(imageFile)
        updateData.image_public_id = result.public_id
      }

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', payload.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } finally {
      isUpdating.value = false
    }
  }

  async function toggleProductStatus(productId, isActive) {
    return updateProduct({
      id: productId,
      is_active: isActive,
    })
  }

  async function fetchUnitStats(productId) {
    isLoadingUnitStats.value = true

    try {
      const { data, error } = await supabase.rpc('get_product_unit_stats', {
        p_product_id: productId,
      })

      if (error) {
        throw error
      }

      unitStats.value = data ?? {
        available: 0,
        sold: 0,
        returned: 0,
        unavailable: 0,
        total: 0,
      }

      return unitStats.value
    } finally {
      isLoadingUnitStats.value = false
    }
  }

  async function registerEntry({ product_id, quantity, reason, note = null }) {
    isRegisteringEntry.value = true

    try {
      const { data, error } = await supabase.rpc('register_entry', {
        p_product_id: product_id,
        p_quantity: quantity,
        p_reason: reason,
        p_note: note,
      })

      if (error) {
        throw error
      }

      return data
    } finally {
      isRegisteringEntry.value = false
    }
  }

  function resetUnitStats() {
    unitStats.value = {
      available: 0,
      sold: 0,
      returned: 0,
      unavailable: 0,
      total: 0,
    }
  }

  function clear() {
    products.value = []
    options.value = {
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
    }
  }

  return {
    isCreating,
    isFetching,
    isUpdating,
    isLoadingUnitStats,
    isRegisteringEntry,
    products,
    options,
    unitStats,
    createProduct,
    fetchProducts,
    fetchProductById,
    fetchOptions,
    updateProduct,
    toggleProductStatus,
    fetchUnitStats,
    registerEntry,
    resetUnitStats,
    clear,
  }
})
