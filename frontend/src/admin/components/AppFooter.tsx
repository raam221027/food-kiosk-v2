import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <a href="https://jcqportfolio.vercel.app/" target="_blank" rel="noopener noreferrer">
          JQ
        </a>
        <span className="ms-1">&copy; 2026 All rights reserved</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Powered by</span>
        <a href="https://jcqportfolio.vercel.app/" target="_blank" rel="noopener noreferrer">
          JQ
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
