<script setup>
import { computed, ref, watch } from 'vue'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, XIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { normalizeText } from '@/utils/text'

const props = defineProps({
  id: {
    type: String,
    default: undefined,
  },
  modelValue: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Selecciona...',
  },
  searchPlaceholder: {
    type: String,
    default: 'Buscar o crear...',
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  clearLabel: {
    type: String,
    default: 'Quitar selección',
  },
  invalid: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const CLEAR_VALUE = '__clear__'

const open = ref(false)
const search = ref('')

watch(open, () => {
  search.value = ''
})

const filteredOptions = computed(() => {
  const term = normalizeText(search.value)
  return props.options.filter((opt) => normalizeText(opt).includes(term))
})

const newValue = computed(() => search.value.trim().replace(/\s+/g, ' '))

const canCreate = computed(
  () =>
    !!newValue.value &&
    !props.options.some((option) => normalizeText(option) === normalizeText(newValue.value)),
)

const showClear = computed(() => props.clearable && !!props.modelValue && !search.value)

function handleUpdate(value) {
  if (value === CLEAR_VALUE || value == null) {
    emit('update:modelValue', '')
    open.value = false
    return
  }

  const canonical = props.options.find((option) => normalizeText(option) === normalizeText(value))

  emit('update:modelValue', canonical ?? value)
  open.value = false
}
</script>

<template>
  <Combobox
    v-model:open="open"
    :model-value="modelValue"
    :ignore-filter="true"
    @update:model-value="handleUpdate"
  >
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <Button
          :id="id"
          type="button"
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          :aria-invalid="invalid"
          class="w-full min-w-0 justify-between font-normal"
        >
          <span class="truncate" :class="{ 'text-muted-foreground': !modelValue }">
            {{ modelValue || placeholder }}
          </span>
          <ChevronsUpDownIcon class="shrink-0 opacity-50" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxList class="w-(--reka-combobox-trigger-width)">
      <ComboboxInput v-model="search" :placeholder="searchPlaceholder" />
      <ComboboxEmpty>Escribe para crear una opción</ComboboxEmpty>
      <ComboboxGroup>
        <ComboboxItem v-for="option in filteredOptions" :key="option" :value="option">
          {{ option }}
          <ComboboxItemIndicator>
            <CheckIcon />
          </ComboboxItemIndicator>
        </ComboboxItem>
        <ComboboxItem v-if="canCreate" :value="newValue">
          <PlusIcon />
          Crear "{{ newValue }}"
        </ComboboxItem>
        <ComboboxItem v-if="showClear" :value="CLEAR_VALUE" class="text-muted-foreground">
          <XIcon />
          {{ clearLabel }}
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
