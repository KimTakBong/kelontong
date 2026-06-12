<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
  size: 'md',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="btn"
    :class="[`btn-${variant}`, `btn-${size}`, { 'btn-block': block }]"
  >
    <span v-if="loading" class="btn-spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.btn-md {
  padding: 0.55rem 1rem;
  font-size: 0.9rem;
}
.btn-sm {
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
}
.btn-block {
  width: 100%;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-alt);
}
.btn-danger {
  background: var(--color-danger);
  color: #fff;
}
.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--color-surface-alt);
  color: var(--color-text);
}
.btn-spinner {
  width: 0.85em;
  height: 0.85em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
