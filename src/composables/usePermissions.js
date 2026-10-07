import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/permissions'

export function usePermissions() {
  const authStore = useAuthStore()

  function can(permission) {
    return hasPermission(authStore.role, permission)
  }

  return { can }
}
