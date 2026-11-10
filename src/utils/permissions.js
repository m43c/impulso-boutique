export const PERMISSIONS = {
  // dashboard
  'dashboard:view-low-stock-alerts': ['admin'],
  // users
  'users:view': ['admin'],
  'users:create': ['admin'],
  'users:update': ['admin'],
  'users:deactivate': ['admin'],
  // products
  'products:view': ['admin', 'advisor', 'cashier'],
  'products:create': ['admin'],
  'products:update': ['admin'],
  'products:toggle-status': ['admin'],
  // inventory
  'inventory:view-units': ['admin', 'advisor', 'cashier'],
  'inventory:view-history': ['admin'],
  'inventory:view-moves': ['admin'],
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

export function hasAnyPermission(role, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false
  }

  return permissions.some((permission) => hasPermission(role, permission))
}
