import { LenisProvider } from './LenisProvider'
import { MotionProvider } from '@/components/motion/FadeIn'
import { AuthProvider } from '@/context/AuthContext'
import { CmsProvider } from '@/context/CmsContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CmsProvider>
          <MotionProvider>
            <LenisProvider>{children}</LenisProvider>
          </MotionProvider>
        </CmsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )

