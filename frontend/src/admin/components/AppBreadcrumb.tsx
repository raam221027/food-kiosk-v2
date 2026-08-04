import React from 'react'
import { useLocation } from 'react-router'

import { routes } from '../routes'
import { ADMIN_BASE } from '../store'
import type { AdminRoute } from '../types'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

interface Breadcrumb {
  pathname: string
  name: string
  active: boolean
}

const AppBreadcrumb = () => {
  // routes.js paths are relative to the admin shell, so drop the /admin prefix
  // before matching, then add it back when building the links.
  const currentLocation = useLocation().pathname.replace(ADMIN_BASE, '')

  const getRouteName = (pathname: string, routes: AdminRoute[]) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location: string) => {
    const breadcrumbs: Breadcrumb[] = []
    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href={ADMIN_BASE}>Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem
            {...(breadcrumb.active
              ? { active: true }
              : { href: `${ADMIN_BASE}${breadcrumb.pathname}` })}
            key={index}
          >
            {breadcrumb.name}
          </CBreadcrumbItem>
        )
      })}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
