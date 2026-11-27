<script setup>
import { reactiveOmit } from '@vueuse/core'
import { cn } from 'cn'
import { CalendarHeader, useForwardProps } from 'reka-ui'

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
  <CalendarHeader
    data-slot="calendar-header"
    :class="cn('relative flex w-full items-center justify-center px-8 pt-1', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarHeader>
</template>
