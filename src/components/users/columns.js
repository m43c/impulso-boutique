import { h } from 'vue'
import { Pencil } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatDateTime, formatRelativeDate } from '@/utils/date'
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
  {
    accessorKey: 'updated_at',
    header: 'Última actualización',
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
    },
    cell: (info) => {
      const val = info.getValue()

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h('button', { type: 'button', class: 'cursor-default' }, formatRelativeDate(val)),
        ),
        h(TooltipContent, () => h('p', formatDateTime(val))),
      ])
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
    },
    cell: (info) =>
      h(
        Button,
        {
          variant: 'ghost',
          size: 'icon',
          'aria-label': `Editar a ${info.row.original.full_name}`,
          class: 'h-8 w-8 rounded-full',
          onClick: () => info.table.options.meta?.onEdit?.(info.row.original),
        },
        () => h(Pencil),
      ),
  },
]
