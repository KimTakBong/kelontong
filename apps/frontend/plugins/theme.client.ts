// Apply the saved/preferred theme as early as possible on the client to avoid a
// flash of the wrong theme.
export default defineNuxtPlugin(() => {
  useTheme().init()
})
