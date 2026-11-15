import { h } from 'vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import { EllipsisVertical, Pencil, PlusCircle, XCircle } from '@lucide/vue'
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
import { normalizeText } from '@/utils/text'

export const columns = [
  {
    accessorKey: 'name',
    header: 'Proveedor',
    meta: {
      skeletonClass: 'h-4 w-40',
      cellClass: 'text-xs max-w-[200px]',
    },
    cell: (info) => {
      const name = info.getValue()

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline-block max-w-full truncate text-left border-b border-dashed border-muted-foreground/50 cursor-help',
            },
            name,
          ),
        ),
        h(TooltipContent, () => h('p', { class: 'max-w-xs' }, name)),
      ])
    },
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
    enableSorting: false,
    meta: {
      skeletonClass: 'h-4 w-28',
      cellClass: 'text-xs max-w-[130px] tabular-nums',
    },
    cell: (info) => h('span', { class: 'whitespace-nowrap' }, info.getValue()),
  },
  {
    id: 'country',
    accessorFn: (row) => normalizeText(row.country),
    header: 'País',
    filterFn: filterFn_arrHas,
    meta: {
      skeletonClass: 'h-4 w-16',
      cellClass: 'text-xs max-w-[120px]',
    },
    cell: (info) => {
      const country = info.row.original.country

      if (!country) {
        return h('span', { class: 'text-muted-foreground italic' }, 'Sin país')
      }

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline-block max-w-full truncate text-left border-b border-dashed border-muted-foreground/50 cursor-help',
            },
            country,
          ),
        ),
        h(TooltipContent, () => h('p', country)),
      ])
    },
  },
  {
    id: 'city',
    accessorFn: (row) => normalizeText(row.city),
    header: 'Ciudad',
    filterFn: filterFn_arrHas,
    meta: {
      skeletonClass: 'h-4 w-20',
      cellClass: 'text-xs max-w-[120px]',
    },
    cell: (info) => {
      const city = info.row.original.city

      if (!city) {
        return h('span', { class: 'text-muted-foreground italic' }, 'Sin ciudad')
      }

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline-block max-w-full truncate text-left border-b border-dashed border-muted-foreground/50 cursor-help',
            },
            city,
          ),
        ),
        h(TooltipContent, () => h('p', city)),
      ])
    },
  },
  {
    id: 'is_active',
    accessorFn: (row) => (row.is_active ? 'Activo' : 'Inactivo'),
    header: 'Estado',
    enableSorting: false,
    enableGlobalFilter: false,
    filterFn: filterFn_arrHas,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-5 w-16 rounded-full',
      cellClass: 'text-center text-xs',
    },
    cell: (info) => {
      const isActive = info.row.original.is_active

      return h(
        Badge,
        {
          variant: 'outline',
          class: isActive
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px]'
            : 'border-rose-500/30 text-rose-400 bg-rose-500/10 text-[11px]',
        },
        () => info.getValue(),
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Creación',
    enableSorting: false,
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-16',
      cellClass: 'text-center text-xs',
    },
    cell: (info) => formatDate(info.getValue()),
  },
  {
    accessorKey: 'updated_at',
    header: 'Actualización',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-20',
      cellClass: 'text-center text-xs',
    },
    cell: (info) => {
      const val = info.getValue()

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class: 'border-muted-foreground/50 min-w-0 cursor-help border-b border-dashed',
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
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-6 w-6 rounded-full',
      cellClass: 'text-center max-w-[50px]',
    },
    cell: (info) => {
      const supplier = info.row.original
      const isActive = supplier.is_active
      const can = info.table.options.meta?.can
      const canUpdate = can?.('suppliers:update') ?? false
      const canToggleStatus = can?.('suppliers:toggle-status') ?? false

      if (!canUpdate && !canToggleStatus) {
        return null
      }

      const items = []

      if (canUpdate) {
        items.push(
          h(
            DropdownMenuItem,
            {
              'aria-label': `Editar a ${supplier.name}`,
              class: 'cursor-pointer text-xs',
              onClick: () => info.table.options.meta?.onEdit?.(supplier),
            },
            () => [h(Pencil, { class: 'h-4 w-4' }), h('span', 'Editar')],
          ),
        )
      }

      if (canToggleStatus) {
        if (items.length > 0) {
          items.push(h(DropdownMenuSeparator))
        }

        items.push(
          h(
            DropdownMenuItem,
            {
              'aria-label': isActive
                ? `Desactivar a ${supplier.name}`
                : `Activar a ${supplier.name}`,
              class: [
                'cursor-pointer text-xs',
                isActive
                  ? 'text-destructive focus:text-destructive focus:bg-destructive/10'
                  : 'text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10',
              ],
              onClick: () => info.table.options.meta?.onToggleStatus?.(supplier),
            },
            () => [
              h(isActive ? XCircle : PlusCircle, {
                class: ['h-4 w-4', isActive ? 'text-destructive' : 'text-emerald-500'],
              }),
              h('span', isActive ? 'Desactivar' : 'Activar'),
            ],
          ),
        )
      }

      return h(DropdownMenu, () => [
        h(DropdownMenuTrigger, { asChild: true }, () =>
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon',
              'aria-label': `Opciones para ${supplier.name}`,
              class: 'h-8 w-8 rounded-full',
            },
            () => h(EllipsisVertical, { class: 'h-4 w-4' }),
          ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => items),
      ])
    },
  },
]
