<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import MovesList from '@/components/moves/MovesList.vue'

const router = useRouter()

const movements = ref([])
const isLoading = ref(false)
const error = ref(null)

async function loadMovements() {
  isLoading.value = true
  error.value = null

  try {
    const { data, error: rpcError } = await supabase.rpc('get_inventory_moves')

    if (rpcError) {
      throw rpcError
    }

    movements.value = data ?? []
  } catch (e) {
    console.error('Error al cargar los movimientos:', e)
    error.value = 'No se pudieron cargar los movimientos'
    movements.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(loadMovements)

function handleViewProduct(productId) {
  if (!productId) {
    return
  }

  router.push({ name: 'product-details', params: { id: productId } })
}

function handleViewUnit(unitId) {
  if (!unitId) {
    return
  }

  router.push({ name: 'unit-details', params: { unitId } })
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <MovesList
      :movements="movements"
      :is-loading="isLoading"
      :error="error"
      @refresh="loadMovements"
      @retry="loadMovements"
      @view-product="handleViewProduct"
      @view-unit="handleViewUnit"
    />
  </div>
</template>
