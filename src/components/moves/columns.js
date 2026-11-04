import { h } from 'vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import { ArrowRight } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateTime } from '@/utils/date'
import { formatMoveType, formatMoveReason } from '@/utils/inventoryMoves'
import { formatUnitStatus } from '@/utils/productUnits'

const TYPE_STYLES = {
  entry: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  exit: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  adjustment: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
}

function shortName(fullName) {
  if (!fullName) {
    return null
  }

  const parts = fullName.trim().split(/\s+/)

  if (parts.length <= 2) {
    return parts.join(' ')
  }

  return `${parts[0]} ${parts.at(-2)}`
}

function buildReferenceText(row) {
  if (row.sale_id) {
    return `Venta #${row.sale_id.slice(0, 8)}`
  }

  if (row.return_id) {
    return `Devolución #${row.return_id.slice(0, 8)}`
  }

  if (row.note) {
    return row.note
  }

  return 'Sin ref/nota'
}

export const columns = [
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    enableGlobalFilter: false,
    meta: { skeletonClass: 'h-4 w-32', cellClass: 'max-w-[120px] text-xs' },
    cell: (info) => h('span', { class: 'whitespace-nowrap' }, formatDateTime(info.getValue())),
  },
  {
    id: 'product_name',
    accessorFn: (row) => row.product_name || 'Producto sin nombre',
    header: 'Producto',
    meta: { skeletonClass: 'h-4 w-50', cellClass: 'max-w-[200px] text-xs' },
    cell: (info) => {
      const name = info.getValue()
      const productId = info.row.original.product_id
      const isActive = info.row.original.product_is_active
      const isFallback = !info.row.original.product_name

      const dotNode = h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class: 'inline-flex p-1 -m-1 cursor-help items-center justify-center',
            },
            [
              h('span', {
                class: [
                  'block h-2 w-2 shrink-0 rounded-full ',
                  isActive ? 'bg-emerald-500' : 'bg-rose-500',
                ],
              }),
            ],
          ),
        ),
        h(TooltipContent, { side: 'top' }, () => h('p', isActive ? 'Vigente' : 'Retirado')),
      ])

      const nameNode = h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class: [
                'block truncate text-left text-xs',
                !isFallback
                  ? 'cursor-pointer border-b border-dashed border-muted-foreground/50 hover:border-transparent hover:underline'
                  : 'text-muted-foreground italic cursor-default',
              ],
              onClick: () => info.table.options.meta?.onViewProduct?.(productId),
            },
            name,
          ),
        ),
        !isFallback
          ? h(TooltipContent, { side: 'top' }, () => h('p', { class: 'max-w-xs' }, name))
          : null,
      ])

      return h('div', { class: 'flex items-center gap-2' }, [dotNode, nameNode])
    },
  },
  {
    accessorKey: 'product_unit_id',
    header: 'Unidad',
    enableSorting: false,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'h-4 w-14',
      cellClass: 'max-w-[80px] text-xs',
    },
    cell: (info) => {
      const unit = info.getValue()
      const meta = info.table.options.meta

      if (!unit) {
        return h('span', { class: 'text-muted-foreground italic' }, 'Sin unidad')
      }

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'block font-mono text-xs cursor-pointer mx-auto border-b border-dashed border-muted-foreground/50 hover:border-transparent hover:underline',
              onClick: () => meta?.onViewUnit?.(unit),
            },
            unit.slice(0, 8),
          ),
        ),
        h(TooltipContent, () => h('p', unit)),
      ])
    },
  },
  {
    id: 'type',
    accessorFn: (row) => formatMoveType(row.type),
    header: 'Tipo',
    filterFn: filterFn_arrHas,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-5 w-14 rounded-full',
      cellClass: 'max-w-[80px] text-center text-xs',
    },
    cell: (info) => {
      const rawType = info.row.original.type

      return h(
        Badge,
        { variant: 'outline', class: [TYPE_STYLES[rawType] ?? '', 'text-[11px]'] },
        () => formatMoveType(rawType),
      )
    },
  },
  {
    id: 'reason',
    accessorFn: (row) => (row.reason ? formatMoveReason(row.reason) : 'Sin razón'),
    header: 'Razón',
    filterFn: filterFn_arrHas,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-14',
      cellClass: 'text-center text-xs',
    },
    cell: (info) => {
      const isFallback = !info.row.original.reason
      return h('span', { class: isFallback ? 'text-muted-foreground italic' : '' }, info.getValue())
    },
  },
  {
    id: 'state_change',
    header: 'Cambio de estado',
    enableSorting: false,
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-32',
      cellClass: 'max-w-[150px] text-center text-xs',
    },
    cell: (info) => {
      const row = info.row.original
      const prev = row.previous_status ? formatUnitStatus(row.previous_status) : null
      const next = row.new_status ? formatUnitStatus(row.new_status) : null

      const baseClass = 'text-xs whitespace-nowrap inline-flex items-center gap-1'

      const renderContent = () => {
        if (!next) {
          return h('span', { class: [baseClass, 'text-muted-foreground italic'] }, 'Sin cambio')
        }

        const arrow = h(ArrowRight, { class: 'h-3 w-3 mt-0.5 shrink-0' })

        if (!prev) {
          return h('span', { class: baseClass }, [
            h('span', { class: 'text-muted-foreground italic' }, 'Nuevo'),
            arrow,
            next,
          ])
        }

        return h('span', { class: baseClass }, [prev, arrow, next])
      }

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class: [
                'mx-auto flex max-w-full items-center justify-center truncate',
                next
                  ? 'cursor-help border-b border-dashed border-muted-foreground/50'
                  : 'cursor-default',
              ],
            },
            [renderContent()],
          ),
        ),
        next
          ? h(TooltipContent, { side: 'top' }, () => {
              return h('p', { class: 'inline-flex items-center whitespace-nowrap' }, [
                !prev ? h('span', { class: 'text-muted-foreground italic' }, 'Nuevo') : prev,
                h(ArrowRight, { class: 'mx-1 mt-0.5 h-3.5 w-3.5 opacity-80' }),
                next,
              ])
            })
          : null,
      ])
    },
  },
  {
    id: 'profile_name',
    accessorFn: (row) => shortName(row.profile_name) || 'Usuario inactivo',
    header: 'Usuario',
    filterFn: filterFn_arrHas,
    meta: { skeletonClass: 'h-4 w-18', cellClass: 'max-w-[120px] text-xs' },
    cell: (info) => {
      const fullName = info.row.original.profile_name
      const displayName = info.getValue()

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class: [
                'truncate block cursor-help border-b border-dashed border-muted-foreground/50',
                !fullName ? 'text-muted-foreground italic' : '',
              ],
            },
            displayName,
          ),
        ),
        h(TooltipContent, () => h('p', fullName || 'Usuario inactivo')),
      ])
    },
  },
  {
    id: 'referenceNote',
    accessorFn: (row) => buildReferenceText(row),
    header: 'Referencia/Nota',
    enableSorting: false,
    meta: { skeletonClass: 'h-4 w-36', cellClass: 'max-w-[150px] text-xs' },
    cell: (info) => {
      const text = info.getValue()
      const isEmpty = text === 'Sin ref/nota'

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class: [
                'truncate max-w-[150px] inline-block text-left cursor-help',
                !isEmpty
                  ? 'border-b border-dashed border-muted-foreground/50'
                  : 'text-muted-foreground italic',
              ],
            },
            text,
          ),
        ),
        h(TooltipContent, () =>
          h('p', { class: 'whitespace-pre-wrap max-w-xs break-words' }, text),
        ),
      ])
    },
  },
]
