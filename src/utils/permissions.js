export const PERMISSIONS = {
  // dashboard
  'dashboard:view-low-stock-alerts': ['admin'],
  // products
  'products:view': ['admin', 'advisor', 'cashier'],
  'products:create': ['admin'],
  'products:update': ['admin'],
  'products:toggle-status': ['admin'],
  // inventory
  'inventory:view-units': ['admin', 'advisor', 'cashier'],
  'inventory:view-history': ['admin'],
  'inventory:view-movements': ['admin'],
  'inventory:register-entry': ['admin'],
  'inventory:register-exit': ['admin'],
  'inventory:reactivate-unit': ['admin'],
  'inventory:count': ['admin'],
}

export function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission]

  if (!allowedRoles) {
    if (import.meta.env.DEV) {
      console.warn(`Permiso desconocido: "${permission}"`)
    }

    return false
  }

  return !!role && allowedRoles.includes(role)
}
