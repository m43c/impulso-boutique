import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/services/cloudinary'

export const useProductsStore = defineStore('products', () => {
  const isCreating = ref(false)
  const isFetching = ref(false)
  const isUpdating = ref(false)
  const isRegisteringEntry = ref(false)
  const isLoadingUnitStats = ref(false)
  const isFetchingUnits = ref(false)
  const isFetchingHistory = ref(false)
  const isFetchingScannedUnit = ref(false)

  const products = ref([])
  const options = ref({ categories: [], brands: [], colors: [], sizes: [] })
  const unitStats = ref({ available: 0, sold: 0, returned: 0, unavailable: 0, total: 0 })
  const productUnits = ref([])
  const productHistory = ref([])
  const scannedUnit = ref(null)
  const scannedProduct = ref(null)

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

  async function createProductVariant(sourceId, payload, imageFile, imagePublicId = null) {
    isCreating.value = true

    try {
      let publicId = null

      if (imageFile) {
        const result = await uploadImage(imageFile)
        publicId = result.public_id
      } else if (imagePublicId) {
        publicId = imagePublicId
      } else {
        throw new Error('La imagen es obligatoria')
      }

      const { data, error } = await supabase.rpc('create_product_variant', {
        p_source_id: sourceId,
        p_name: payload.name,
        p_description: payload.description,
        p_category: payload.category,
        p_brand: payload.brand,
        p_color: payload.color,
        p_size: payload.size,
        p_price: payload.price,
        p_min_stock: payload.min_stock,
        p_image_public_id: publicId,
      })

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
      const [productsRes, stockRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_stock').select('*'),
      ])

      if (productsRes.error) {
        throw productsRes.error
      }

      if (stockRes.error) {
        throw stockRes.error
      }

      const stockById = new Map(stockRes.data.map((s) => [s.id, s]))

      products.value = productsRes.data.map((p) => ({
        ...p,
        ...(stockById.get(p.id) ?? {
          stock_available: 0,
          stock_sold: 0,
          stock_returned: 0,
          stock_unavailable: 0,
          stock_total: 0,
          is_low_stock: false,
        }),
      }))

      return products.value
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

  async function fetchProductUnits(productId) {
    isFetchingUnits.value = true

    try {
      const { data, error } = await supabase.rpc('get_product_units', {
        p_product_id: productId,
      })

      if (error) {
        throw error
      }

      productUnits.value = data ?? []
      return productUnits.value
    } catch (error) {
      productUnits.value = []
      throw error
    } finally {
      isFetchingUnits.value = false
    }
  }

  async function fetchProductHistory(productId) {
    isFetchingHistory.value = true

    try {
      const { data, error } = await supabase.rpc('get_product_history', {
        p_product_id: productId,
      })

      if (error) {
        throw error
      }

      productHistory.value = data ?? []
      return productHistory.value
    } catch (error) {
      productHistory.value = []
      throw error
    } finally {
      isFetchingHistory.value = false
    }
  }

  async function fetchScannedUnit(unitId) {
    isFetchingScannedUnit.value = true

    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*, product:products(*)')
        .eq('id', unitId)
        .maybeSingle()

      if (error) {
        console.error('Error al obtener la unidad:', error)

        if (error.code === '22P02') {
          resetScannedUnit()
          return null
        }

        throw error
      }

      if (!data) {
        console.error('Unidad no encontrada:', unitId)

        resetScannedUnit()
        return null
      }

      const { product, ...unit } = data

      const { data: firstMove, error: moveError } = await supabase
        .from('inventory_moves')
        .select('reason, note')
        .eq('product_unit_id', unitId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (moveError) {
        console.error('Error al obtener origen de la unidad:', moveError)
      }

      const finalUnit = {
        ...unit,
        origin_reason: firstMove?.reason ?? null,
        note: firstMove?.note ?? null,
      }

      scannedUnit.value = finalUnit
      scannedProduct.value = product

      return { unit: finalUnit, product }
    } catch (error) {
      resetScannedUnit()
      throw error
    } finally {
      isFetchingScannedUnit.value = false
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

  function resetProductUnits() {
    productUnits.value = []
  }

  function resetProductHistory() {
    productHistory.value = []
  }

  function resetScannedUnit() {
    scannedUnit.value = null
    scannedProduct.value = null
  }

  function clear() {
    products.value = []
    options.value = { categories: [], brands: [], colors: [], sizes: [] }
    productUnits.value = []
  }

  return {
    isCreating,
    isFetching,
    isUpdating,
    isRegisteringEntry,
    isLoadingUnitStats,
    isFetchingUnits,
    isFetchingHistory,
    isFetchingScannedUnit,
    products,
    options,
    unitStats,
    productUnits,
    productHistory,
    scannedUnit,
    scannedProduct,
    createProduct,
    createProductVariant,
    fetchProducts,
    fetchProductById,
    fetchOptions,
    updateProduct,
    toggleProductStatus,
    registerEntry,
    fetchUnitStats,
    fetchProductUnits,
    fetchProductHistory,
    fetchScannedUnit,
    resetUnitStats,
    resetProductUnits,
    resetProductHistory,
    resetScannedUnit,
    clear,
  }
})
