const roleLabels = {
  admin: 'Administrador',
  advisor: 'Vendedor',
  cashier: 'Cajero',
}

export function formatRole(role) {
  return roleLabels[role] ?? role
}
