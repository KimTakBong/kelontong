<script setup lang="ts">
// Root just routes to the product list (the app's home for authenticated users).
definePageMeta({ middleware: 'auth' })
await navigateTo('/products', { replace: true })
</script>

<template>
  <div />
</template>
