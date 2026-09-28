<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card>
    <CardContent class="flex flex-col gap-2">
      <div class="flex justify-between">
        <Skeleton class="h-5 w-36" />
        <Skeleton class="h-6 w-6 rounded-full" />
      </div>
      <Skeleton class="h-4 w-48" />
      <div class="flex items-center justify-between">
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-5 w-16 rounded-full" />
      </div>
      <div class="flex flex-col gap-0.5 pt-2">
        <Skeleton class="h-3 w-24" />
        <Skeleton class="h-3 w-24" />
      </div>
    </CardContent>
  </Card>
</template>
