import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/services/cloudinary'

export const useProductsStore = defineStore('products', () => {
  const isCreating = ref(false)
  const isFetching = ref(false)
  const isUpdating = ref(false)

  const products = ref([])
  const options = ref({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
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
    products,
    options,
    createProduct,
    fetchProducts,
    fetchOptions,
    updateProduct,
    clear,
  }
})
