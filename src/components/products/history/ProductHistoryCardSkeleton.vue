<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-1.5 p-4 text-xs">
      <!-- Date -->
      <div class="flex min-w-0 items-baseline gap-1">
        <span class="text-muted-foreground shrink-0">Fecha:</span>
        <Skeleton class="h-3.5 w-32" />
      </div>
      <!-- Unit -->
      <div class="flex min-w-0 items-baseline gap-1">
        <span class="text-muted-foreground shrink-0">Unidad:</span>
        <Skeleton class="h-3.5 w-full" />
      </div>
      <!-- Type -->
      <div class="flex min-w-0 items-center gap-1.5">
        <span class="text-muted-foreground shrink-0">Tipo:</span>
        <Skeleton class="h-4 w-20 rounded-full" />
      </div>
      <!-- User -->
      <div class="flex min-w-0 items-baseline gap-1">
        <span class="text-muted-foreground shrink-0">Usuario:</span>
        <Skeleton class="h-3.5 w-full" />
      </div>
      <!-- Ref / Note -->
      <div class="flex min-w-0 items-baseline gap-1">
        <span class="text-muted-foreground shrink-0">Ref/Nota:</span>
        <Skeleton class="h-3.5 w-full" />
      </div>
    </CardContent>
  </Card>
</template>
