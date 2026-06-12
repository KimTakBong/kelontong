<script setup lang="ts">
withDefaults(defineProps<{ open: boolean; title?: string; size?: 'sm' | 'lg' }>(), {
  size: 'sm',
})
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <div class="modal card" :class="`modal-${size}`" role="dialog" aria-modal="true">
          <div v-if="title || $slots.header" class="modal-head row between">
            <h3 v-if="title">{{ title }}</h3>
            <slot name="header" />
            <button class="modal-close" aria-label="Tutup" @click="emit('close')">
              ×
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.actions" class="modal-actions row">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}
.modal {
  width: 100%;
  box-shadow: var(--shadow-md);
  /* Tall content (e.g. the product form) scrolls inside the modal. */
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-sm {
  max-width: 420px;
}
.modal-lg {
  max-width: 680px;
}
.modal-head {
  align-items: flex-start;
  margin-bottom: 0.25rem;
}
.modal-head h3 {
  margin: 0;
}
.modal-close {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
}
.modal-close:hover {
  color: var(--color-text);
}
.modal-body {
  overflow-y: auto;
  margin: 0 -0.25rem;
  padding: 0.25rem;
}
.modal-actions {
  margin: 1.25rem -1.25rem -1.25rem;
  padding: 1rem 1.25rem;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-alt);
  border-radius: 0 0 var(--radius) var(--radius);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
