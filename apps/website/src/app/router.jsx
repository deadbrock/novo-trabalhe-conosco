import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { CandidateLayout } from '@/layouts/CandidateLayout'
import { ProtectedRoute, GuestRoute } from '@/components/auth/ProtectedRoute'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const CulturePage = lazy(() => import('@/pages/CulturePage').then((m) => ({ default: m.CulturePage })))
const BenefitsPage = lazy(() => import('@/pages/BenefitsPage').then((m) => ({ default: m.BenefitsPage })))
const AreasPage = lazy(() => import('@/pages/AreasPage').then((m) => ({ default: m.AreasPage })))
const ProcessPage = lazy(() => import('@/pages/ProcessPage').then((m) => ({ default: m.ProcessPage })))
const TalentPoolPage = lazy(() => import('@/pages/TalentPoolPage').then((m) => ({ default: m.TalentPoolPage })))
const JobsPage = lazy(() => import('@/pages/JobsPage').then((m) => ({ default: m.JobsPage })))
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage').then((m) => ({ default: m.JobDetailPage })))
const CandidatePortalPage = lazy(() =>
  import('@/pages/CandidatePortalPage').then((m) => ({ default: m.CandidatePortalPage })),
)
const CandidateProfilePage = lazy(() =>
  import('@/pages/CandidateProfilePage').then((m) => ({ default: m.CandidateProfilePage })),
)
const CandidateApplicationsPage = lazy(() =>
  import('@/pages/CandidateApplicationsPage').then((m) => ({ default: m.CandidateApplicationsPage })),
)
const CandidatePreAdmissionPage = lazy(() =>
  import('@/pages/CandidatePreAdmissionPage').then((m) => ({ default: m.CandidatePreAdmissionPage })),
)
const CandidateEthnicDeclarationPage = lazy(() =>
  import('@/pages/EthnicDeclarationPage').then((m) => ({ default: m.EthnicDeclarationPage })),
)
const CandidateSigningReturnPage = lazy(() =>
  import('@/pages/SigningReturnPage').then((m) => ({ default: m.SigningReturnPage })),
)
const CandidateSignaturesPage = lazy(() =>
  import('@/pages/CandidateSignaturesPage').then((m) => ({ default: m.CandidateSignaturesPage })),
)
const CandidateSigningPage = lazy(() =>
  import('@/pages/CandidateSigningPage').then((m) => ({ default: m.CandidateSigningPage })),
)
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const RegisterSuccessPage = lazy(() =>
  import('@/pages/RegisterSuccessPage').then((m) => ({ default: m.RegisterSuccessPage })),
)
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-brand-red-600 animate-spin" />
    </div>
  )
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

function withGuest(Component) {
  return withSuspense(() => (
    <GuestRoute>
      <Component />
    </GuestRoute>
  ))
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: 'nossa-historia', element: withSuspense(HistoryPage) },
      { path: 'nossa-cultura', element: withSuspense(CulturePage) },
      { path: 'beneficios', element: withSuspense(BenefitsPage) },
      { path: 'areas-de-atuacao', element: withSuspense(AreasPage) },
      { path: 'processo-seletivo', element: withSuspense(ProcessPage) },
      { path: 'banco-de-talentos', element: withSuspense(TalentPoolPage) },
      { path: 'vagas', element: withSuspense(JobsPage) },
      { path: 'vagas/:slug', element: withSuspense(JobDetailPage) },
      { path: 'portal-do-candidato/assinatura/retorno', element: withSuspense(CandidateSigningReturnPage) },
      { path: '*', element: withSuspense(NotFoundPage) },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: withGuest(LoginPage) },
      { path: 'cadastro', element: withGuest(RegisterPage) },
      { path: 'cadastro/sucesso', element: withSuspense(RegisterSuccessPage) },
      { path: 'verificar-email', element: withSuspense(VerifyEmailPage) },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <CandidateLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'portal-do-candidato', element: withSuspense(CandidatePortalPage) },
      { path: 'portal-do-candidato/perfil', element: withSuspense(CandidateProfilePage) },
      { path: 'portal-do-candidato/candidaturas', element: withSuspense(CandidateApplicationsPage) },
      { path: 'portal-do-candidato/documentacao', element: withSuspense(CandidatePreAdmissionPage) },
      { path: 'portal-do-candidato/autodeclaracao-etnica', element: withSuspense(CandidateEthnicDeclarationPage) },
      { path: 'portal-do-candidato/assinaturas', element: withSuspense(CandidateSignaturesPage) },
      { path: 'portal-do-candidato/assinaturas/:id/assinar', element: withSuspense(CandidateSigningPage) },
    ],
  },
])
