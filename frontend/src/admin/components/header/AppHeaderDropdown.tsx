import { useNavigate } from 'react-router'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilAccountLogout, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import { useAuth } from '@/auth/useAuth'
import { humanize } from '../../utils/format'
import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const user = useAuth((state) => state.user)
  const role = useAuth((state) => state.role)
  const signOut = useAuth((state) => state.signOut)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    // replace, so Back does not land on a dashboard that no longer loads.
    navigate('/login', { replace: true })
  }

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <CDropdownItem as="div" className="d-flex align-items-center">
          <CIcon icon={cilUser} className="me-2" />
          <span className="text-truncate"></span>
          {role && (
            <CBadge color="info" className="ms-2 text-nowrap">
              {humanize(role)}
            </CBadge>
          )}
        </CDropdownItem>
        {user?.email && (
          <CDropdownItem as="div" className="text-body-secondary small text-truncate">
            {user.email}
          </CDropdownItem>
        )}
        <CDropdownDivider />
        <CDropdownItem role="button" onClick={handleLogout}>
          <CIcon icon={cilAccountLogout} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
