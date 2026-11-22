<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-2 p-4">
      <!-- Date + total -->
      <div class="flex items-center justify-between gap-2">
        <Skeleton class="h-3.5 w-28" />
        <Skeleton class="h-4 w-16" />
      </div>
      <!-- Items/Garments -->
      <Skeleton class="h-4 w-3/4" />
      <!-- Quantity + payment -->
      <div class="flex items-center justify-between gap-2">
        <Skeleton class="h-3.5 w-32" />
        <Skeleton class="h-4 w-4 rounded" />
      </div>
    </CardContent>
  </Card>
</template>
