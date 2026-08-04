import { useEffect } from 'react'
import { useColorModes } from '@coreui/react'

import DefaultLayout from './layout/DefaultLayout'

// Bootstrap/CoreUI styles. Imported here rather than in main.tsx so Vite emits
// them in this route's async chunk — the Tailwind-styled kiosk pages never
// download them unless someone actually opens /admin.
import './scss/style.scss'

const AdminApp = () => {
  const { isColorModeSet, setColorMode } = useColorModes('food-kiosk-admin-theme')

  useEffect(() => {
    if (!isColorModeSet()) {
      setColorMode('light')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <DefaultLayout />
}

export default AdminApp
