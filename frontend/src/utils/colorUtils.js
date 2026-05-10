export function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function lightenHex(hex, p) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * p / 100))
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * p / 100))
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * p / 100))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function darkenHex(hex, p) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * p / 100))
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * p / 100))
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * p / 100))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function applyAgencyTheme(agencyData) {
  if (!agencyData) return
  const root = document.documentElement
  if (agencyData.primary_color) {
    const p = agencyData.primary_color
    root.style.setProperty('--lk-amber',      p)
    root.style.setProperty('--lk-amber-light', lightenHex(p, 20))
    root.style.setProperty('--lk-amber-dark',  darkenHex(p, 20))
    root.style.setProperty('--lk-amber-bg',    hexAlpha(p, 0.08))
    root.style.setProperty('--lk-amber-bg-2',  hexAlpha(p, 0.15))
  }
}

export function resetTheme() {
  const root = document.documentElement
  root.style.removeProperty('--lk-amber')
  root.style.removeProperty('--lk-amber-light')
  root.style.removeProperty('--lk-amber-dark')
  root.style.removeProperty('--lk-amber-bg')
  root.style.removeProperty('--lk-amber-bg-2')
}