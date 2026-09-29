<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-2 p-4">
      <div class="flex items-center justify-between gap-2">
        <!-- Name -->
        <Skeleton class="h-5 w-56" />
        <!-- Actions menu -->
        <Skeleton class="h-8 w-8 shrink-0 rounded-full" />
      </div>
      <div class="flex items-stretch gap-3 pb-2">
        <!-- Image -->
        <Skeleton class="h-28 w-28 shrink-0 rounded-md" />
        <div class="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <!-- Brand -->
          <Skeleton class="h-3.5 w-24" />
          <!-- Size -->
          <Skeleton class="h-3.5 w-24" />
          <!-- Color -->
          <Skeleton class="h-3.5 w-24" />
          <!-- Category -->
          <Skeleton class="h-3.5 w-24" />
          <!-- Status -->
          <Skeleton class="h-3.5 w-24" />
        </div>
      </div>
      <div class="flex flex-col gap-2 border-t pt-3">
        <div class="flex items-center justify-between">
          <!-- Price -->
          <Skeleton class="h-5 w-20" />
          <!-- Min stock -->
          <Skeleton class="h-3.5 w-24" />
        </div>
      </div>
      <!-- Date -->
      <Skeleton class="h-3 w-30" />
    </CardContent>
  </Card>
</template>
