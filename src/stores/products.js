import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/services/cloudinary'

export const useProductsStore = defineStore('products', () => {
  const isCreating = ref(false)
  const isFetching = ref(false)

  const products = ref([])

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

  function clear() {
    products.value = []
  }

  return {
    isCreating,
    isFetching,
    products,
    createProduct,
    fetchProducts,
    clear,
  }
})
