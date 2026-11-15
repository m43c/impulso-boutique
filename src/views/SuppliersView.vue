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
import SupplierDeactivateModal from '@/components/suppliers/SupplierDeactivateModal.vue'
import SupplierForm from '@/components/suppliers/SupplierForm.vue'
import SuppliersList from '@/components/suppliers/SuppliersList.vue'
import { getSupplierErrorMessage } from '@/utils/supplierErrors'
import { usePermissions } from '@/composables/usePermissions'
import { useSuppliersStore } from '@/stores/suppliers'

const suppliersStore = useSuppliersStore()

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const isFormOpen = ref(false)
const fetchError = ref(null)
const formError = ref(null)
const formSupplier = ref(null)
const formKey = ref(0)
const isDeactivateOpen = ref(false)
const supplierToDeactivate = ref(null)
const deactivateProductCount = ref(0)

const isEditing = computed(() => formSupplier.value !== null)

const isSaving = computed(() => suppliersStore.isCreating || suppliersStore.isUpdating)

const formTitle = computed(() => (isEditing.value ? 'Editar proveedor' : 'Agregar proveedor'))

const formDescription = computed(() =>
  isEditing.value
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
  loadSuppliers()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

async function handleSubmit(formData) {
  formError.value = null

  try {
    const payload = {
      name: formData.name,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
    }

    if (isEditing.value) {
      await suppliersStore.updateSupplier(formSupplier.value.id, payload)
      toast.success('Proveedor actualizado correctamente')
    } else {
      await suppliersStore.createSupplier(payload)
      toast.success('Proveedor creado correctamente')
    }

    isFormOpen.value = false
    formSupplier.value = null

    loadSuppliers()
  } catch (error) {
    console.error('Error al guardar el proveedor:', error)
    formError.value = getSupplierErrorMessage(
      error,
      isEditing.value ? 'No se pudo actualizar el proveedor' : 'No se pudo crear el proveedor',
    )
  }
}

function handleCancel() {
  isFormOpen.value = false
  formSupplier.value = null
  formError.value = null
}

function handleAddSupplier() {
  formSupplier.value = null
  formError.value = null
  formKey.value += 1
  isFormOpen.value = true
}

function handleEditSupplier(supplier) {
  formSupplier.value = supplier
  formError.value = null
  formKey.value += 1
  isFormOpen.value = true
}

function closeDeactivateModal() {
  isDeactivateOpen.value = false
  supplierToDeactivate.value = null
  deactivateProductCount.value = 0
}

function handleDeactivateOpenChange(open) {
  if (open) {
    isDeactivateOpen.value = true
    return
  }

  if (suppliersStore.isTogglingStatus) {
    return
  }

  closeDeactivateModal()
}

async function applyStatusToggle(supplier, isDeactivating) {
  const actionText = isDeactivating ? 'desactivar' : 'activar'

  try {
    await suppliersStore.toggleSupplierStatus(supplier)
    toast.success(`Proveedor ${isDeactivating ? 'desactivado' : 'activado'} correctamente`)

    if (isDeactivating) {
      closeDeactivateModal()
    }
  } catch (error) {
    console.error(`Error al ${actionText} el proveedor:`, error)
    toast.error(getSupplierErrorMessage(error, `No se pudo ${actionText} el proveedor`))
  }
}

async function handleToggleStatus(supplier) {
  const isDeactivating = supplier.is_active

  if (!isDeactivating) {
    await applyStatusToggle(supplier, false)
    return
  }

  try {
    const productCount = await suppliersStore.countSupplierProducts(supplier.id)

    if (productCount > 0) {
      supplierToDeactivate.value = supplier
      deactivateProductCount.value = productCount
      isDeactivateOpen.value = true
      return
    }
  } catch (error) {
    console.error('Error al verificar los productos del proveedor:', error)
    toast.error(getSupplierErrorMessage(error, 'No se pudieron verificar los productos asociados'))
    return
  }

  await applyStatusToggle(supplier, true)
}

function handleConfirmDeactivate() {
  if (!supplierToDeactivate.value) {
    return
  }

  applyStatusToggle(supplierToDeactivate.value, true)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <!-- Suppliers list -->
    <SuppliersList
      :suppliers="suppliersStore.suppliers"
      :is-loading="suppliersStore.isFetching"
      :is-updating-status="suppliersStore.isTogglingStatus || suppliersStore.isCountingProducts"
      :error="fetchError"
      @add-supplier="handleAddSupplier"
      @edit-supplier="handleEditSupplier"
      @toggle-status="handleToggleStatus"
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
    <Dialog v-if="isDesktop" v-model:open="isFormOpen">
      <DialogContent
        v-if="can('suppliers:create') || can('suppliers:update')"
        class="px-5 py-4 sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle class="text-sm">{{ formTitle }}</DialogTitle>
          <DialogDescription class="text-xs">{{ formDescription }}</DialogDescription>
        </DialogHeader>
        <SupplierForm
          :key="formKey"
          :supplier="formSupplier"
          :is-loading="isSaving"
          :error-message="formError"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </DialogContent>
    </Dialog>
    <!-- Mobile view -->
    <Drawer v-else v-model:open="isFormOpen">
      <DrawerContent
        v-if="can('suppliers:create') || can('suppliers:update')"
        class="flex h-[90dvh] flex-col pb-1"
      >
        <DrawerHeader class="px-5 pt-3 pb-4 text-left">
          <DrawerTitle class="text-sm">{{ formTitle }}</DrawerTitle>
          <DrawerDescription class="text-xs">{{ formDescription }}</DrawerDescription>
        </DrawerHeader>

        <SupplierForm
          :key="formKey"
          class="min-h-0 flex-1 px-5 pb-4"
          :supplier="formSupplier"
          :is-loading="isSaving"
          :error-message="formError"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </DrawerContent>
    </Drawer>
    <!-- Deactivate warning -->
    <SupplierDeactivateModal
      :open="isDeactivateOpen"
      :supplier="supplierToDeactivate"
      :product-count="deactivateProductCount"
      :is-loading="suppliersStore.isTogglingStatus"
      @update:open="handleDeactivateOpenChange"
      @confirm="handleConfirmDeactivate"
    />
  </div>
</template>
