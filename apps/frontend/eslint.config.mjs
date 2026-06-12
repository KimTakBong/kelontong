// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // We intentionally clear reactive validation-error maps in place via
    // `delete errors[key]` (ProductForm, UserForm, register). That's a
    // legitimate pattern for a reactive Record, so allow the dynamic delete.
    '@typescript-eslint/no-dynamic-delete': 'off',
  },
})
