<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex items-center gap-3 p-3">
      <!-- QR -->
      <Skeleton class="h-20 w-20 shrink-0 rounded-md" />
      <!-- Info -->
      <div class="flex flex-1 flex-col gap-2">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-3 w-28" />
        <Skeleton class="h-3 w-28" />
        <Skeleton class="h-3 w-24" />
      </div>
      <!-- Actions menu -->
      <Skeleton class="h-8 w-8 shrink-0 self-start rounded-full" />
    </CardContent>
  </Card>
</template>
