<script setup>
import { computed } from 'vue'
import { RotateCcw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'

const props = defineProps({
  groups: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['toggle', 'clear'])

function isSelected(group, value) {
  return group.selected.includes(value)
}

const hasActiveFilters = computed(() => props.groups.some((group) => group.selected.length > 0))
</script>

<template>
  <Command class="bg-transparent">
    <CommandInput placeholder="Buscar filtro..." />
    <CommandList class="max-h-72">
      <CommandEmpty>No se encontraron resultados</CommandEmpty>
      <template v-for="(group, index) in groups" :key="group.columnId">
        <CommandSeparator v-if="index > 0" />
        <CommandGroup v-if="group.options.length" :heading="group.label">
          <CommandItem
            v-for="option in group.options"
            :key="option.value"
            :value="`${group.label} ${option.label}`"
            @select.prevent="emit('toggle', group.columnId, option.value)"
          >
            <Checkbox
              :model-value="isSelected(group, option.value)"
              tabindex="-1"
              class="pointer-events-none mr-2"
            />
            <span>{{ option.label }}</span>
            <span class="text-muted-foreground ml-auto text-xs">{{ option.count }}</span>
          </CommandItem>
        </CommandGroup>
      </template>
    </CommandList>
    <!-- Reset filters button -->
    <div class="border-t p-1.5">
      <Button
        variant="secondary"
        size="sm"
        :disabled="!hasActiveFilters"
        class="w-full text-xs"
        @click="emit('clear')"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Limpiar filtros
      </Button>
    </div>
  </Command>
</template>
