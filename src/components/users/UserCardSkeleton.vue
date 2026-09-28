<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-3 p-4">
      <div class="flex justify-between">
        <div class="flex flex-col gap-1">
          <Skeleton class="h-5 w-48" />
          <Skeleton class="h-4 w-36" />
        </div>
        <Skeleton class="h-6 w-6 rounded-full" />
      </div>
      <div class="flex items-center justify-between">
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-5 w-16 rounded-full" />
      </div>
      <Skeleton class="h-3 w-30" />
    </CardContent>
  </Card>
</template>
