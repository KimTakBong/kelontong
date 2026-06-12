<script setup lang="ts">
// Image with graceful fallback when the URL is missing or fails to load.
const props = withDefaults(
  defineProps<{ src?: string | null; alt?: string; size?: number }>(),
  { alt: 'Produk', size: 44 },
)

const failed = ref(false)
const showImage = computed(() => !!props.src && !failed.value)

// Reset the failed flag if the src changes (e.g. live preview in the form).
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <div class="thumb" :style="{ width: `${size}px`, height: `${size}px` }">
    <img
      v-if="showImage"
      :src="src!"
      :alt="alt"
      loading="lazy"
      @error="failed = true"
    >
    <svg
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class="placeholder"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  </div>
</template>

<style scoped>
.thumb {
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.placeholder {
  width: 55%;
  height: 55%;
  color: var(--color-text-muted);
  opacity: 0.5;
}
</style>
