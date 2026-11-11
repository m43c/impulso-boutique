<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Plus } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import SupplierForm from '@/components/suppliers/SupplierForm.vue'
import SuppliersList from '@/components/suppliers/SuppliersList.vue'
import { getSupplierErrorMessage } from '@/utils/supplierErrors'
import { usePermissions } from '@/composables/usePermissions'
import { useSuppliersStore } from '@/stores/suppliers'

const suppliersStore = useSuppliersStore()

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const isSheetOpen = ref(false)
const fetchError = ref(null)
const formError = ref(null)
const formSupplier = ref(null)
const formKey = ref(0)

const formTitle = computed(() => (formSupplier.value ? 'Editar proveedor' : 'Agregar proveedor'))

const formDescription = computed(() =>
  formSupplier.value
    ? 'Actualiza la información del proveedor'
    : 'Completa la información del nuevo proveedor',
)

async function loadSuppliers() {
  fetchError.value = null

  try {
    await suppliersStore.fetchSuppliers()
  } catch (error) {
    console.error('Error al cargar proveedores:', error)
    fetchError.value = 'No se pudieron cargar los proveedores'
  }
}

const isScrollingDown = ref(false)
let lastScrollY = 0

function handleScroll() {
  const currentScrollY = window.scrollY

  if (currentScrollY <= 0) {
    isScrollingDown.value = false
    lastScrollY = currentScrollY
    return
  }

  const diff = currentScrollY - lastScrollY

  if (diff > 10) {
    isScrollingDown.value = true
  } else if (diff < -10) {
    isScrollingDown.value = false
  }

  if (Math.abs(diff) > 2) {
    lastScrollY = currentScrollY
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

async function handleSubmit(formData) {
  formError.value = null

  try {
    await suppliersStore.createSupplier({
      name: formData.name,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
    })

    toast.success('Proveedor creado correctamente')

    isSheetOpen.value = false
    formSupplier.value = null

    loadSuppliers()
  } catch (error) {
    console.error('Error al guardar el proveedor:', error)
    formError.value = getSupplierErrorMessage(error, 'No se pudo crear el proveedor')
  }
}

function handleCancel() {
  isSheetOpen.value = false
  formSupplier.value = null
  formError.value = null
}

function handleAddSupplier() {
  formSupplier.value = null
  formError.value = null
  formKey.value += 1
  isSheetOpen.value = true
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <!-- Suppliers list -->
    <SuppliersList
      :suppliers="suppliersStore.suppliers"
      :is-loading="suppliersStore.isFetching"
      :error="fetchError"
      @add-supplier="handleAddSupplier"
      @retry="loadSuppliers"
      @refresh="loadSuppliers"
    />
    <!-- Floating add supplier button -->
    <Button
      v-if="can('suppliers:create')"
      size="icon"
      :class="[
        'fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300 md:hidden',
        isScrollingDown
          ? 'pointer-events-none translate-y-4 opacity-0'
          : 'translate-y-0 opacity-100',
      ]"
      aria-label="Agregar proveedor"
      :disabled="suppliersStore.isCreating"
      @click="handleAddSupplier"
    >
      <Plus class="size-5" />
    </Button>
    <!-- Desktop view -->
    <Dialog v-if="isDesktop" v-model:open="isSheetOpen">
      <DialogContent v-if="can('suppliers:create')" class="px-5 py-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle class="text-sm">{{ formTitle }}</DialogTitle>
          <DialogDescription class="text-xs">{{ formDescription }}</DialogDescription>
        </DialogHeader>
        <SupplierForm
          :key="formKey"
          :supplier="formSupplier"
          mode="create"
          :is-loading="suppliersStore.isCreating"
          :error-message="formError"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </DialogContent>
    </Dialog>
    <!-- Mobile view -->
    <Drawer v-else v-model:open="isSheetOpen">
      <DrawerContent v-if="can('suppliers:create')" class="flex h-[90dvh] flex-col pb-1">
        <DrawerHeader class="px-5 pt-3 pb-2 text-left">
          <DrawerTitle class="text-sm">{{ formTitle }}</DrawerTitle>
          <DrawerDescription class="text-xs">{{ formDescription }}</DrawerDescription>
        </DrawerHeader>

        <SupplierForm
          :key="formKey"
          class="min-h-0 flex-1 px-5 pb-4"
          :supplier="formSupplier"
          mode="create"
          :is-loading="suppliersStore.isCreating"
          :error-message="formError"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </DrawerContent>
    </Drawer>
  </div>
</template>
