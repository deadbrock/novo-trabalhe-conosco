import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Users,
  UserCircle,
  Calendar,
  MessageSquare,
  FileCheck,
  Building2,
  BarChart3,
  Globe,
  Settings,
} from 'lucide-react'

export const ADMIN_ROUTES = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
    breadcrumb: ['Dashboard'],
  },
  {
    path: '/recrutamento/vagas',
    label: 'Vagas',
    icon: Briefcase,
    permission: 'recruitment:read',
    breadcrumb: ['Recrutamento', 'Vagas'],
    phase: 2,
  },
  {
    path: '/pipeline',
    label: 'Pipeline',
    icon: Kanban,
    permission: 'pipeline:read',
    breadcrumb: ['Pipeline'],
    phase: 3,
  },
  {
    path: '/banco-de-talentos',
    label: 'Banco de Talentos',
    icon: Users,
    permission: 'talent_pool:read',
    breadcrumb: ['Banco de Talentos'],
    phase: 4,
  },
  {
    path: '/candidatos',
    label: 'Candidatos',
    icon: UserCircle,
    permission: 'candidates:read',
    breadcrumb: ['Candidatos'],
    phase: 5,
    children: [
      { path: '/candidatos', label: 'Todos', end: true, breadcrumb: ['Candidatos'] },
      { path: '/candidatos/reprovados', label: 'Reprovados', breadcrumb: ['Candidatos', 'Reprovados'] },
    ],
  },
  {
    path: '/entrevistas',
    label: 'Entrevistas',
    icon: Calendar,
    permission: 'interviews:read',
    breadcrumb: ['Entrevistas'],
    phase: 6,
  },
  {
    path: '/comunicacao',
    label: 'Comunicação',
    icon: MessageSquare,
    permission: 'communication:read',
    breadcrumb: ['Comunicação'],
    phase: 6,
  },
  {
    path: '/pre-admissao',
    label: 'Pré-admissão',
    icon: FileCheck,
    permission: 'pre_admission:read',
    breadcrumb: ['Pré-admissão'],
    phase: 7,
  },
  {
    path: '/departamento-pessoal',
    label: 'DP',
    icon: Building2,
    permission: 'hr_department:read',
    breadcrumb: ['Departamento Pessoal'],
    phase: 7,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    permission: 'analytics:read',
    breadcrumb: ['Analytics'],
    phase: 9,
  },
  {
    path: '/cms',
    label: 'Conteúdo do Portal',
    icon: Globe,
    permission: 'cms:read',
    breadcrumb: ['Conteúdo do Portal'],
    phase: 8,
  },
  {
    path: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
    permission: 'settings:read',
    breadcrumb: ['Configurações'],
    phase: 10,
  },
]

export function findRouteByPath(pathname) {
  if (pathname === '/') {
    return ADMIN_ROUTES.find((route) => route.path === '/')
  }

  for (const route of ADMIN_ROUTES) {
    if (!route.children?.length || !pathname.startsWith(route.path)) continue

    const sortedChildren = [...route.children].sort((a, b) => b.path.length - a.path.length)
    for (const child of sortedChildren) {
      const matches = child.end
        ? pathname === child.path
        : pathname === child.path || pathname.startsWith(`${child.path}/`)

      if (matches) {
        return {
          ...route,
          breadcrumb: child.breadcrumb || [...route.breadcrumb, child.label],
        }
      }
    }
  }

  return ADMIN_ROUTES.find((route) => {
    if (route.path === '/') return false
    return pathname.startsWith(route.path)
  })
}
