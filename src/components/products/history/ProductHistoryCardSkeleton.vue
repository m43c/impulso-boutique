<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-1.5 p-4 text-xs">
      <!-- Date -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3 w-10" />
        <Skeleton class="h-3.5 w-32" />
      </div>
      <!-- Unit -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-10" />
        <Skeleton class="h-3.5 w-14" />
      </div>
      <!-- Type -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-8" />
        <Skeleton class="h-4 w-12 rounded-full" />
      </div>
      <!-- User -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-10" />
        <Skeleton class="h-3.5 w-20" />
      </div>
      <!-- Ref/note -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-12" />
        <Skeleton class="h-3.5 w-full" />
      </div>
    </CardContent>
  </Card>
</template>
