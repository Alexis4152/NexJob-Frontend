// Convierte un color hex (#RRGGBB) en el shading 50-900 que consume tailwind.config.js
// via las variables CSS --brand-*, mezclando hacia blanco/negro segun el tono pedido.
function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function mix(c1, c2, weight) {
  return Math.round(c1 * (1 - weight) + c2 * weight)
}

export function applyBrandColor(hex) {
  if (!hex || !/^#([0-9a-f]{6})$/i.test(hex)) return
  const { r, g, b } = hexToRgb(hex)
  const shades = {
    50: 0.95, 100: 0.9, 200: 0.75, 300: 0.55, 400: 0.3,
    500: 0, 600: -0.12, 700: -0.28, 800: -0.42, 900: -0.55,
  }
  const root = document.documentElement
  Object.entries(shades).forEach(([shade, weight]) => {
    const target = weight >= 0 ? 255 : 0
    const w = Math.abs(weight)
    const rr = mix(r, target, w)
    const gg = mix(g, target, w)
    const bb = mix(b, target, w)
    root.style.setProperty(`--brand-${shade}`, `${rr} ${gg} ${bb}`)
  })
}
