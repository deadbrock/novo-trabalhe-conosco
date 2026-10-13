import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { ADMIN_ROUTES } from '@/constants/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { UserMenu } from '@/components/layout/UserMenu'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'
import { useEffect, useState } from 'react'

const SIDEBAR_KEY = 'fg_recruit_sidebar_collapsed'

function NavItem({ path, label, icon: Icon, end, collapsed }) {
  return (
    <NavLink
      to={path}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-neutral-100 text-neutral-900 font-medium'
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50',
        )
      }
    >
      <Icon size={16} strokeWidth={1.75} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

function NavGroup({ item, collapsed }) {
  const { path, label, icon: Icon, children } = item

  if (collapsed) {
    return <NavItem path={path} label={label} icon={Icon} end={false} collapsed={collapsed} />
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        <Icon size={14} strokeWidth={1.75} className="shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="ml-2 pl-2 border-l border-neutral-100 space-y-0.5">
        {children.map((child) => (
          <NavLink
            key={child.path}
            to={child.path}
            end={child.end ?? false}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-neutral-100 text-neutral-900 font-medium'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50',
              )
            }
          >
            <span className="truncate">{child.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { hasPermission } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')

  const visibleItems = ADMIN_ROUTES.filter((item) => hasPermission(item.permission))
  const currentRoute = ADMIN_ROUTES.find((route) => {
    if (route.path === '/') return location.pathname === '/'
    return location.pathname.startsWith(route.path)
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const breadcrumbItems = (findBreadcrumb(location.pathname) || currentRoute?.breadcrumb || ['Dashboard']).map(
    (label, index, arr) => ({
      label,
      href: index < arr.length - 1 ? breadcrumbHref(location.pathname, label, index, arr) : undefined,
    }),
  )

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      <aside
        className={cn(
          'shrink-0 border-r border-neutral-200 bg-white flex flex-col transition-[width] duration-200',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <div className={cn('h-14 flex items-center border-b border-neutral-100', collapsed ? 'px-3 justify-center' : 'px-5')}>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight">FG Recruit</p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Centro de Operações</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#003d7a] text-white text-xs font-bold flex items-center justify-center">
              FG
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {visibleItems.map((item) =>
            item.children?.length ? (
              <NavGroup key={item.path} item={item} collapsed={collapsed} />
            ) : (
              <NavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                end={item.path === '/'}
                collapsed={collapsed}
              />
            ),
          )}
        </nav>

        <div className="p-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-50 transition-colors',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-neutral-200 bg-white px-6 flex items-center justify-between gap-4">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center gap-2">
            {hasPermission('candidates:read') && <NotificationBell />}
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function findBreadcrumb(pathname) {
  for (const route of ADMIN_ROUTES) {
    if (!route.children?.length || !pathname.startsWith(route.path)) continue

    const sortedChildren = [...route.children].sort((a, b) => b.path.length - a.path.length)
    for (const child of sortedChildren) {
      const matches = child.end
        ? pathname === child.path
        : pathname === child.path || pathname.startsWith(`${child.path}/`)

      if (matches) {
        return child.breadcrumb || [...route.breadcrumb, child.label]
      }
    }
  }

  if (/^\/candidatos\/[^/]+$/.test(pathname)) {
    return ['Candidatos', 'Detalhe']
  }

  return null
}

function breadcrumbHref(pathname, label, index, arr) {
  if (label === 'Candidatos') return '/candidatos'
  if (label === 'Reprovados') return '/candidatos/reprovados'
  if (index === arr.length - 2 && /^\/candidatos\/[^/]+$/.test(pathname)) return '/candidatos'
  return undefined
}
