// Display formatting helpers (currency in IDR, dates). Pure functions, no state.
const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function useFormat() {
  function formatPrice(value: number): string {
    return idr.format(value)
  }

  function formatDate(value: string | Date | undefined | null): string {
    if (!value) return '-'
    return new Date(value).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return { formatPrice, formatDate }
}
