import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/date'
import { formatRole } from '@/utils/roles'

export const columns = [
  {
    accessorKey: 'full_name',
    header: 'Nombre',
  },
  {
    accessorKey: 'email',
    header: 'Correo',
  },
  {
    accessorKey: 'role',
    header: 'Rol',
    cell: (info) => formatRole(info.getValue()),
  },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
    },
    cell: (info) =>
      h(
        Badge,
        {
          variant: info.getValue() ? 'success' : 'destructive',
        },
        () => (info.getValue() ? 'Activo' : 'Inactivo'),
      ),
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha de creación',
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
    },
    cell: (info) => formatDate(info.getValue()),
  },
]
