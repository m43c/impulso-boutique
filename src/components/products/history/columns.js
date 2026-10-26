import { h } from 'vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateTime } from '@/utils/date'
import { formatMoveType, formatMoveReason } from '@/utils/inventoryMoves'

const TYPE_STYLES = {
  entry: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  exit: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  adjustment: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
}

export const columns = [
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    enableGlobalFilter: false,
    meta: { skeletonClass: 'h-4 w-32' },
    cell: (info) =>
      h('span', { class: 'text-xs whitespace-nowrap' }, formatDateTime(info.getValue())),
  },
  {
    accessorKey: 'product_unit_id',
    header: 'Unidad',
    meta: { skeletonClass: 'h-4 w-14' },
    cell: (info) => {
      const unit = info.getValue()

      if (!unit) {
        return h('span', { class: 'text-muted-foreground' }, 'Sin unidad')
      }

      return h(TooltipProvider, { delayDuration: 200 }, () =>
        h(Tooltip, () => [
          h(TooltipTrigger, { asChild: true }, () =>
            h(
              'span',
              { class: 'truncate max-w-40 block font-mono text-[13px] font-medium cursor-default' },
              unit.slice(0, 8),
            ),
          ),
          h(TooltipContent, () => h('p', { class: 'break-all max-w-xs' }, unit)),
        ]),
      )
    },
  },
  {
    id: 'type',
    accessorFn: (row) => formatMoveType(row.type),
    header: 'Tipo',
    filterFn: filterFn_arrHas,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-5 w-20 rounded-full',
    },
    cell: (info) => {
      const rawType = info.row.original.type

      return h(Badge, { variant: 'outline', class: TYPE_STYLES[rawType] ?? '' }, () =>
        formatMoveType(rawType),
      )
    },
  },
  {
    id: 'reason',
    accessorFn: (row) => (row.reason ? formatMoveReason(row.reason) : 'Sin razón'),
    header: 'Razón',
    filterFn: filterFn_arrHas,
    meta: { skeletonClass: 'h-4 w-20' },
    cell: (info) =>
      info.row.original.reason ? formatMoveReason(info.row.original.reason) : 'Sin razón',
  },
  {
    id: 'profile_name',
    accessorFn: (row) => row.profile_name || 'Sin usuario',
    header: 'Responsable',
    filterFn: filterFn_arrHas,
    meta: { skeletonClass: 'h-4 w-40' },
    cell: (info) => {
      const fullName = info.getValue()
      const parts = fullName.trim().split(/\s+/)

      const shortName = !parts.length
        ? 'Usuario'
        : parts.length <= 2
          ? parts.join(' ')
          : `${parts[0]} ${parts.at(-2)}`

      return h(TooltipProvider, { delayDuration: 200 }, () =>
        h(Tooltip, () => [
          h(TooltipTrigger, { asChild: true }, () =>
            h('span', { class: 'truncate max-w-40 block cursor-default' }, shortName),
          ),
          h(TooltipContent, () => h('p', fullName)),
        ]),
      )
    },
  },
  {
    id: 'reference',
    accessorFn: (row) => {
      if (row.sale_id) {
        return `Venta #${row.sale_id.slice(0, 8)}`
      }

      if (row.return_id) {
        return `Devolución #${row.return_id.slice(0, 8)}`
      }

      if (row.note) {
        return row.note
      }

      return 'Sin referencia / nota'
    },
    header: 'Referencia / Nota',
    meta: { skeletonClass: 'h-4 w-[180px]' },
    cell: (info) => {
      const text = info.getValue()

      return h(TooltipProvider, { delayDuration: 200 }, () =>
        h(Tooltip, () => [
          h(TooltipTrigger, { asChild: true }, () =>
            h(
              'span',
              { class: 'text-muted-foreground truncate max-w-[180px] block cursor-default' },
              text,
            ),
          ),
          h(TooltipContent, () => h('p', text)),
        ]),
      )
    },
  },
]
