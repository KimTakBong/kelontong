<script setup lang="ts">
// Renders the global toast queue. Mounted once in the default layout.
const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toast-host">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
        @click="dismiss(t.id)"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 60;
  max-width: min(360px, 90vw);
}
.toast {
  padding: 0.7rem 1rem;
  border-radius: var(--radius);
  color: #fff;
  font-size: 0.88rem;
  box-shadow: var(--shadow-md);
  cursor: pointer;
}
.toast-success {
  background: var(--color-success);
}
.toast-error {
  background: var(--color-danger);
}
.toast-info {
  background: var(--color-primary);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
