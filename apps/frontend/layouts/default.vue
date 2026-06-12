<script setup lang="ts">
// App shell for authenticated pages: fixed left sidebar nav + a top bar holding
// the theme toggle and user menu. The login/register pages use the `auth` layout.
const { user, isAdmin, logout } = useAuth()
const toast = useToast()
const route = useRoute()

// Mobile: sidebar is an off-canvas drawer toggled by the hamburger.
const sidebarOpen = ref(false)

// Close the drawer on navigation.
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)

const navItems = computed(() => [
  { to: '/products', label: 'Produk', icon: 'box', show: true },
  { to: '/users', label: 'Pengguna', icon: 'users', show: isAdmin.value },
  { to: '/logs', label: 'API Log', icon: 'activity', show: isAdmin.value },
])

async function onLogout(): Promise<void> {
  await logout()
  toast.success('Berhasil keluar')
  navigateTo('/auth/login')
}

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="app-shell">
    <!-- Backdrop behind the mobile drawer -->
    <div
      v-if="sidebarOpen"
      class="backdrop"
      @click="sidebarOpen = false"
    />

    <!-- Left sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand"><span>Klontong Admin</span></div>

      <nav class="sidebar-nav">
        <template v-for="item in navItems" :key="item.to">
          <NuxtLink
            v-if="item.show"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item.to) }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <template v-if="item.icon === 'box'">
                <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.3 7L12 12l8.7-5M12 22V12" />
              </template>
              <template v-else-if="item.icon === 'users'">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
              </template>
              <template v-else>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </template>
            </svg>
            <span>{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>

      <!-- User summary pinned to the bottom of the sidebar -->
      <div v-if="user" class="sidebar-user">
        <div class="sidebar-user-info">
          <div class="user-name">{{ user.name }}</div>
          <span class="badge" :class="isAdmin ? 'badge-admin' : 'badge-staff'">
            {{ user.role }}
          </span>
        </div>
      </div>
    </aside>

    <!-- Main column: top bar + page content -->
    <div class="main-col">
      <header class="topbar">
        <button class="hamburger" aria-label="Menu" @click="sidebarOpen = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <div class="spacer" />

        <ThemeToggle />

        <div v-if="user" class="topbar-user">
          <span class="user-name text-sm">{{ user.name }}</span>
          <BaseButton variant="secondary" size="sm" @click="onLogout">
            Keluar
          </BaseButton>
        </div>
      </header>

      <main class="container">
        <slot />
      </main>
    </div>

    <ToastHost />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
}

/* ── Sidebar ───────────────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.05rem;
  padding: 1.15rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 0.75rem;
  flex: 1;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius);
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.9rem;
}
.nav-link svg {
  width: 1.15rem;
  height: 1.15rem;
}
.nav-link:hover {
  text-decoration: none;
  background: var(--color-surface-alt);
  color: var(--color-text);
}
.nav-link.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.sidebar-user {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
}
.sidebar-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* ── Main column ───────────────────────────────────── */
.main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
/* The sidebar already frames the page, so the content fills the column instead
   of the global 1100px centered container. */
.main-col main.container {
  max-width: none;
  width: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1.25rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 30;
}
.spacer {
  flex: 1;
}
.topbar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.user-name {
  font-weight: 600;
}
.hamburger {
  display: none;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.hamburger svg {
  width: 1.2rem;
  height: 1.2rem;
}

.backdrop {
  display: none;
}

/* ── Mobile: sidebar becomes an off-canvas drawer ──── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: var(--shadow-md);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .hamburger {
    display: inline-flex;
  }
  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 40;
  }
  .topbar-user .user-name {
    display: none;
  }
}
</style>
