<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-2 p-4 text-xs">
      <!-- Fecha -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Fecha:</span>
        <Skeleton class="h-3.5 w-28" />
      </div>
      <!-- Product + dot -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Producto:</span>
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton class="h-3.5 w-3/4" />
          <Skeleton class="h-3 w-3 shrink-0 rounded-full" />
        </div>
      </div>
      <!-- Unit -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Unidad:</span>
        <Skeleton class="h-3.5 w-14" />
      </div>
      <!-- Type -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Tipo:</span>
        <Skeleton class="h-5 w-16 rounded-full" />
      </div>
      <!-- Reason -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Razón:</span>
        <Skeleton class="h-3.5 w-20" />
      </div>
      <!-- Toggle status -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Cambio:</span>
          <Skeleton class="h-3.5 w-32" />
      </div>
      <!-- User -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Usuario:</span>
        <Skeleton class="h-3.5 w-40" />
      </div>
      <!-- Ref/Note -->
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-muted-foreground shrink-0">Ref/Nota:</span>
        <Skeleton class="h-3.5 w-full" />
      </div>
    </CardContent>
  </Card>
</template>
