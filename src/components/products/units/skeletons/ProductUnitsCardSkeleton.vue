<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex gap-4 p-4">
      <!-- QR -->
      <Skeleton class="h-20 w-20 shrink-0 rounded-md" />
      <!-- Info -->
      <div class="flex min-w-0 flex-1 flex-col gap-2 text-xs">
        <div class="flex gap-2">
          <Skeleton class="h-3 w-12" />
          <Skeleton class="h-3 w-14" />
        </div>
        <div class="flex items-center gap-2">
          <Skeleton class="h-3 w-10" />
          <Skeleton class="h-4 w-16 rounded-full" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-3 w-12" />
          <Skeleton class="h-3 w-14" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-3 w-12" />
          <Skeleton class="h-3 w-12" />
        </div>
      </div>
      <!-- Actions menu -->
      <Skeleton class="-mt-0.5 -mr-1 h-6 w-6 shrink-0 rounded-full" />
    </CardContent>
  </Card>
</template>
