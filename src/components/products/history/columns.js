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
    meta: { skeletonClass: 'h-4 w-32', cellClass: 'text-xs max-w-[80px]' },
    cell: (info) =>
      h('span', { class: 'text-xs whitespace-nowrap' }, formatDateTime(info.getValue())),
  },
  {
    accessorKey: 'product_unit_id',
    header: 'Unidad',
    enableSorting: false,
    meta: { skeletonClass: 'h-4 w-14', cellClass: 'text-xs max-w-[40px]' },
    cell: (info) => {
      const unit = info.getValue()

      if (!unit) {
        return h('span', { class: 'italic text-muted-foreground text-xs' }, 'Sin unidad')
      }

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'border-muted-foreground/50 min-w-0 cursor-help border-b border-dashed  block font-mono text-xs ',
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
      cellClass: 'text-center text-xs max-w-[40px]',
      skeletonClass: 'mx-auto h-5 w-16 rounded-full',
    },
    cell: (info) => {
      const rawType = info.row.original.type

      return h(
        Badge,
        { variant: 'outline', class: `text-[11px] ${TYPE_STYLES[rawType]} ?? ''` },
        () => formatMoveType(rawType),
      )
    },
  },
  {
    id: 'reason',
    accessorFn: (row) => (row.reason ? formatMoveReason(row.reason) : 'Sin razón'),
    header: 'Razón',
    filterFn: filterFn_arrHas,
    meta: { skeletonClass: 'h-4 w-14', cellClass: 'text-xs max-w-[45px]' },
    cell: (info) =>
      info.row.original.reason ? formatMoveReason(info.row.original.reason) : 'Sin razón',
  },
  {
    id: 'profile_name',
    accessorFn: (row) => row.profile_name || 'Sin usuario',
    header: 'Usuario',
    filterFn: filterFn_arrHas,
    meta: { skeletonClass: 'h-4 w-20', cellClass: 'text-xs max-w-[60px]' },
    cell: (info) => {
      const row = info.row.original
      const fullName = row.profile_name

      if (!fullName) {
        return h('span', { class: 'italic text-muted-foreground' }, 'Sin usuario')
      }

      const parts = fullName.trim().split(/\s+/)

      const shortName = !parts.length
        ? 'Usuario'
        : parts.length <= 2
          ? parts.join(' ')
          : `${parts[0]} ${parts.at(-2)}`

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline-block max-w-full truncate text-left border-muted-foreground/50 min-w-0 cursor-help border-b border-dashed',
            },
            shortName,
          ),
        ),
        h(TooltipContent, () => h('p', { class: 'max-w-xs break-words' }, fullName)),
      ])
    },
  },
  {
    id: 'referenceNote',
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

      return 'Sin referencia/nota'
    },
    header: 'Referencia/Nota',
    enableSorting: false,
    meta: { skeletonClass: 'h-4 w-30', cellClass: 'text-xs max-w-[90px]' },
    cell: (info) => {
      const row = info.row.original
      const text = info.getValue()

      const hasRefNote = !!(row.sale_id || row.return_id || row.note)

      if (!hasRefNote) {
        return h('span', { class: 'italic text-muted-foreground' }, text)
      }

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline-block max-w-full truncate text-left border-muted-foreground/50 min-w-0 cursor-help border-b border-dashed',
            },
            text,
          ),
        ),
        h(TooltipContent, () => h('p', { class: 'max-w-xs break-words' }, text)),
      ])
    },
  },
]
