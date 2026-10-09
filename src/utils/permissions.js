export const PERMISSIONS = {
  // products
  'products:view': ['admin', 'advisor', 'cashier'],
  'products:create': ['admin'],
  'products:update': ['admin'],
  'products:toggle-status': ['admin'],
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
