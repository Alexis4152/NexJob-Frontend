import { createContext, useContext, useEffect, useState } from 'react'
import { getPlatformConfig } from '../api/platformConfig'
import { applyBrandColor } from '../utils/theme'

const PlatformConfigContext = createContext(null)

/** Carga la configuracion publica de la plataforma (nombre, logo, colores) una vez al
 * arrancar la app y aplica el color de marca a las variables CSS que consume Tailwind. */
export function PlatformConfigProvider({ children }) {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    getPlatformConfig()
      .then((r) => {
        setConfig(r.data.data)
        if (r.data.data?.primaryColor) applyBrandColor(r.data.data.primaryColor)
      })
      .catch(() => {})
  }, [])

  return <PlatformConfigContext.Provider value={{ config }}>{children}</PlatformConfigContext.Provider>
}

export const usePlatformConfig = () => useContext(PlatformConfigContext)
