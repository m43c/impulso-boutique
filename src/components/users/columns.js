import { h } from 'vue'
import { EllipsisVertical, Pencil, UserX } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatDateTime, formatRelativeDate } from '@/utils/date'
import { formatRole } from '@/utils/roles'

export const columns = [
  {
    accessorKey: 'full_name',
    header: 'Nombre completo',
    meta: {
      skeletonClass: 'h-4 w-32',
    },
  },
  {
    accessorKey: 'email',
    header: 'Correo electrónico',
    meta: {
      skeletonClass: 'h-4 w-44',
    },
  },
  {
    accessorKey: 'role',
    header: 'Rol',
    meta: {
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) => formatRole(info.getValue()),
  },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-5 w-16 rounded-full',
      cellClass: 'text-center',
    },
    cell: (info) => {
      const isActive = info.getValue()

      return h(
        Badge,
        {
          variant: 'outline',
          class: isActive
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
            : 'border-rose-500/30 text-rose-400 bg-rose-500/10',
        },
        () => (isActive ? 'Activo' : 'Inactivo'),
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Creación',
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-24',
      cellClass: 'text-center',
    },
    cell: (info) => formatDate(info.getValue()),
  },
  {
    accessorKey: 'updated_at',
    header: 'Actualización',
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-24',
      cellClass: 'text-center',
    },
    cell: (info) => {
      const val = info.getValue()

      return h(Tooltip, () => [
        h(
          TooltipTrigger,
          {
            asChild: true,
          },
          () =>
            h(
              'button',
              {
                type: 'button',
                class: 'cursor-default',
              },
              formatRelativeDate(val),
            ),
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
      skeletonClass: 'mx-auto h-8 w-8 rounded-full',
      cellClass: 'text-center',
    },
    cell: (info) => {
      const user = info.row.original

      return h(DropdownMenu, () => [
        h(
          DropdownMenuTrigger,
          {
            asChild: true,
          },
          () =>
            h(
              Button,
              {
                variant: 'ghost',
                size: 'icon',
                'aria-label': `Opciones para ${user.full_name}`,
                class: 'h-8 w-8 rounded-full',
              },
              () =>
                h(EllipsisVertical, {
                  class: 'h-4 w-4',
                }),
            ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => [
          // Edit user
          h(
            DropdownMenuItem,
            {
              'aria-label': `Editar a ${user.full_name}`,
              class: 'cursor-pointer',
              onClick: () => info.table.options.meta?.onEdit?.(user),
            },
            () => [
              h(Pencil, {
                class: 'mr-2 h-4 w-4',
              }),
              h('span', 'Editar'),
            ],
          ),
          // Deactivate user
          h(DropdownMenuSeparator),
          h(
            DropdownMenuItem,
            {
              'aria-label': `Desactivar a ${user.full_name}`,
              class:
                'text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer',
              onClick: () => console.log('Desactivar:', user),
            },
            () => [
              h(UserX, {
                class: 'mr-2 h-4 w-4 text-destructive',
              }),
              h('span', 'Desactivar'),
            ],
          ),
        ]),
      ])
    },
  },
]
