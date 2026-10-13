import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-semibold text-neutral-200">404</p>
      <h1 className="text-xl font-semibold mt-2">Página não encontrada</h1>
      <p className="text-sm text-neutral-500 mt-2">O recurso solicitado não existe no FG Recruit.</p>
      <Link to="/" className="mt-6">
        <Button variant="secondary">Ir para o dashboard</Button>
      </Link>
    </div>
  )
}
