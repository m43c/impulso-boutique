<script setup>
import { computed } from 'vue'
import { Check, EllipsisVertical, Printer, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps({
  unit: { type: Object, required: true },
  reviewing: { type: Function, default: null },
  onApprove: { type: Function, default: null },
  onDiscard: { type: Function, default: null },
  onReprint: { type: Function, default: null },
  triggerClass: { type: String, default: 'h-8 w-8' },
})

const isDisabled = computed(() => Boolean(props.reviewing?.()))

function run(handler) {
  if (isDisabled.value) {
    return
  }

  handler?.()
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :class="['shrink-0 rounded-full', triggerClass]"
        :aria-label="`Opciones para unidad ${unit.unit_code}`"
      >
        <EllipsisVertical class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        class="cursor-pointer text-xs text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500"
        :disabled="isDisabled"
        @click="run(onApprove)"
      >
        <Check class="h-4 w-4 text-emerald-500" />
        <span>Aprobar</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        class="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs"
        :disabled="isDisabled"
        @click="run(onDiscard)"
      >
        <X class="text-destructive h-4 w-4" />
        <span>Descartar</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="cursor-pointer text-xs"
        :disabled="isDisabled"
        @click="run(onReprint)"
      >
        <Printer class="h-4 w-4" />
        <span>Reimprimir QR</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
