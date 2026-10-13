import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { PermissionProvider } from '@/context/PermissionContext'
import { ProtectedRoute, GuestRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { AdminLayout } from '@/layouts/AdminLayout'
import { apiClient } from '@/services/api'
import { setupAuthInterceptors } from '@/services/authInterceptor'
import { ADMIN_ROUTES } from '@/constants/navigation'
import { Skeleton } from '@/components/ui/Skeleton'

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const JobsListPage = lazy(() => import('@/pages/jobs/JobsListPage').then((m) => ({ default: m.JobsListPage })))
const JobFormPage = lazy(() => import('@/pages/jobs/JobFormPage').then((m) => ({ default: m.JobFormPage })))
const PipelinePage = lazy(() => import('@/pages/pipeline/PipelinePage').then((m) => ({ default: m.PipelinePage })))
const TalentPoolListPage = lazy(() => import('@/pages/talent-pool/TalentPoolListPage').then((m) => ({ default: m.TalentPoolListPage })))
const CandidatesListPage = lazy(() => import('@/pages/candidates/CandidatesListPage').then((m) => ({ default: m.CandidatesListPage })))
const CandidateDetailPage = lazy(() => import('@/pages/candidates/CandidateDetailPage').then((m) => ({ default: m.CandidateDetailPage })))
const InterviewsPage = lazy(() => import('@/pages/interviews/InterviewsPage').then((m) => ({ default: m.InterviewsPage })))
const CommunicationPage = lazy(() => import('@/pages/communication/CommunicationPage').then((m) => ({ default: m.CommunicationPage })))
const PreAdmissionListPage = lazy(() => import('@/pages/pre-admission/PreAdmissionListPage').then((m) => ({ default: m.PreAdmissionListPage })))
const PreAdmissionDetailPage = lazy(() => import('@/pages/pre-admission/PreAdmissionDetailPage').then((m) => ({ default: m.PreAdmissionDetailPage })))
const HrDepartmentListPage = lazy(() => import('@/pages/hr-department/HrDepartmentListPage').then((m) => ({ default: m.HrDepartmentListPage })))
const HrDepartmentDetailPage = lazy(() => import('@/pages/hr-department/HrDepartmentDetailPage').then((m) => ({ default: m.HrDepartmentDetailPage })))
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const CmsListPage = lazy(() => import('@/pages/cms/CmsListPage').then((m) => ({ default: m.CmsListPage })))
const CmsEditorPage = lazy(() => import('@/pages/cms/CmsEditorPage').then((m) => ({ default: m.CmsEditorPage })))
const ProfilePage = lazy(() => import('@/pages/settings/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })))
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function PageLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-3 gap-4 pt-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  )
}

function AuthInterceptorSetup({ children }) {
  const { setSessionExpired } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setupAuthInterceptors(apiClient, () => {
      setSessionExpired()
      navigate('/login', { replace: true })
    })
  }, [setSessionExpired, navigate])

  return children
}

function ModulePlaceholder({ route }) {
  return (
    <PlaceholderPage
      title={route.label}
      description={`Módulo ${route.label} — implementação prevista na Fase ${route.phase}.`}
      phase={route.phase}
    />
  )
}

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionProvider>{children}</PermissionProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export function AppRouter() {
  const moduleRoutes = ADMIN_ROUTES.filter(
    (route) =>
      route.path !== '/' &&
      route.path !== '/recrutamento/vagas' &&
      route.path !== '/pipeline' &&
      route.path !== '/banco-de-talentos' &&
      route.path !== '/candidatos' &&
      route.path !== '/entrevistas' &&
      route.path !== '/comunicacao' &&
      route.path !== '/pre-admissao' &&
      route.path !== '/departamento-pessoal' &&
      route.path !== '/analytics' &&
      route.path !== '/cms' &&
      route.path !== '/configuracoes',
  )

  return (
    <BrowserRouter>
      <AuthInterceptorSetup>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route
                  index
                  element={
                    <RequirePermission permission="dashboard:read">
                      <DashboardPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="recrutamento/vagas"
                  element={
                    <RequirePermission permission="recruitment:read">
                      <JobsListPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="recrutamento/vagas/nova"
                  element={
                    <RequirePermission permission="recruitment:write">
                      <JobFormPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="recrutamento/vagas/:id"
                  element={
                    <RequirePermission permission="recruitment:write">
                      <JobFormPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="pipeline"
                  element={
                    <RequirePermission permission="pipeline:read">
                      <PipelinePage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="banco-de-talentos"
                  element={
                    <RequirePermission permission="talent_pool:read">
                      <TalentPoolListPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="candidatos/reprovados"
                  element={
                    <RequirePermission permission="candidates:read">
                      <CandidatesListPage rejectedOnly />
                    </RequirePermission>
                  }
                />
                <Route
                  path="candidatos"
                  element={
                    <RequirePermission permission="candidates:read">
                      <CandidatesListPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="candidatos/:id"
                  element={
                    <RequirePermission permission="candidates:read">
                      <CandidateDetailPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="entrevistas"
                  element={
                    <RequirePermission permission="interviews:read">
                      <InterviewsPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="comunicacao"
                  element={
                    <RequirePermission permission="communication:read">
                      <CommunicationPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="pre-admissao"
                  element={
                    <RequirePermission permission="pre_admission:read">
                      <PreAdmissionListPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="pre-admissao/:id"
                  element={
                    <RequirePermission permission="pre_admission:read">
                      <PreAdmissionDetailPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="departamento-pessoal"
                  element={
                    <RequirePermission permission="hr_department:read">
                      <HrDepartmentListPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="departamento-pessoal/:id"
                  element={
                    <RequirePermission permission="hr_department:read">
                      <HrDepartmentDetailPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="analytics"
                  element={
                    <RequirePermission permission="analytics:read">
                      <AnalyticsPage />
                    </RequirePermission>
                  }
                />

                <Route
                  path="cms"
                  element={
                    <RequirePermission permission="cms:read">
                      <CmsListPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="cms/:slug"
                  element={
                    <RequirePermission permission="cms:read">
                      <CmsEditorPage />
                    </RequirePermission>
                  }
                />

                <Route path="perfil" element={<ProfilePage />} />

                <Route
                  path="configuracoes"
                  element={
                    <RequirePermission permission="settings:read">
                      <SettingsPage />
                    </RequirePermission>
                  }
                />

                {moduleRoutes.filter((r) => r.path !== '/recrutamento/vagas').map((route) => (
                  <Route
                    key={route.path}
                    path={route.path.replace(/^\//, '')}
                    element={
                      <RequirePermission permission={route.permission}>
                        <ModulePlaceholder route={route} />
                      </RequirePermission>
                    }
                  />
                ))}

                <Route path="403" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthInterceptorSetup>
    </BrowserRouter>
  )
}
