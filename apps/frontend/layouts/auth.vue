<script setup lang="ts">
// Centered, minimal layout for login & register.
</script>

<template>
  <div class="auth-shell">
    <div class="auth-toggle">
      <ThemeToggle />
    </div>
    <div class="auth-card">
      <div class="auth-brand">🛒 Klontong Admin</div>
      <slot />
    </div>
    <ToastHost />
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--color-bg);
}
.auth-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  padding: 2rem;
}
.auth-brand {
  text-align: center;
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}
</style>
