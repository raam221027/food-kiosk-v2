import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

import { CBadge, CNavLink, CSidebarNav } from '@coreui/react'

import { useAuth } from '@/auth/useAuth'
import type { Role } from '@/auth/roles'
import { ADMIN_BASE } from '../store'
import type { NavBadge, NavItem } from '../types'

interface AppSidebarNavProps {
  items: NavItem[]
}

/**
 * Drops entries the role may not see, recursing into groups so a group left
 * with no visible children disappears rather than rendering empty.
 */
const filterByRole = (items: NavItem[], role: Role | null): NavItem[] =>
  items.reduce<NavItem[]>((visible, item) => {
    if (item.roles && (!role || !item.roles.includes(role))) {
      return visible
    }
    if (item.items) {
      const children = filterByRole(item.items, role)
      return children.length ? [...visible, { ...item, items: children }] : visible
    }
    return [...visible, item]
  }, [])

export const AppSidebarNav = ({ items }: AppSidebarNavProps) => {
  const role = useAuth((state) => state.role)
  const navLink = (name?: ReactNode, icon?: ReactNode, badge?: NavBadge, indent = false) => {
    return (
      <>
        {icon
          ? icon
          : indent && (
              <span className="nav-icon">
                <span className="nav-icon-bullet"></span>
              </span>
            )}
        {name && name}
        {badge && (
          <CBadge color={badge.color} className="ms-auto" size="sm">
            {badge.text}
          </CBadge>
        )}
      </>
    )
  }

  const navItem = (item: NavItem, index: number, indent = false) => {
    const { component, name, badge, icon, roles, ...rest } = item
    void roles
    const Component = component
    // _nav.tsx keeps plain paths ('/dashboard'); the shell is mounted at /admin.
    if (rest.to) {
      rest.to = `${ADMIN_BASE}${rest.to}`
    }
    return (
      <Component as="div" key={index}>
        {rest.to || rest.href ? (
          <CNavLink
            {...(rest.to && { as: NavLink })}
            {...(rest.href && { target: '_blank', rel: 'noopener noreferrer' })}
            {...rest}
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    )
  }

  const navGroup = (item: NavItem, index: number) => {
    const { component, name, icon, items, to, roles, ...rest } = item
    void to
    void roles
    const Component = component
    return (
      <Component compact as="div" key={index} toggler={navLink(name, icon)} {...rest}>
        {items?.map((subItem, subIndex) =>
          subItem.items ? navGroup(subItem, subIndex) : navItem(subItem, subIndex, true),
        )}
      </Component>
    )
  }

  const visibleItems = filterByRole(items ?? [], role)

  return (
    <CSidebarNav as={SimpleBar}>
      {visibleItems.map((item, index) =>
        item.items ? navGroup(item, index) : navItem(item, index),
      )}
    </CSidebarNav>
  )
}
