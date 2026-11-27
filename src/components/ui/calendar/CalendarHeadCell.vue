<script setup>
import { reactiveOmit } from '@vueuse/core'
import { cn } from 'cn'
import { CalendarHeadCell, useForwardProps } from 'reka-ui'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: [String, Object, Function], required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarHeadCell
    data-slot="calendar-head-cell"
    :class="cn('text-muted-foreground flex-1 rounded-md text-[0.7rem] font-normal', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarHeadCell>
</template>
