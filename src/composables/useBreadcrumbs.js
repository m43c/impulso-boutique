import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const override = ref(null) // estado module-level, compartido

export function useBreadcrumbs() {
  const route = useRoute()

  const breadcrumbs = computed(() =>
    override.value ?? route.meta.breadcrumb ?? []
  )

  function setBreadcrumbs(items) {
    override.value = items
  }

  function clearBreadcrumbs() {
    override.value = null
  }

  return { breadcrumbs, setBreadcrumbs, clearBreadcrumbs }
}