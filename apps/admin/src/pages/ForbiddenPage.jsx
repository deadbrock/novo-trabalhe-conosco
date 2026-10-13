import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
        <ShieldX size={22} />
      </div>
      <h1 className="text-xl font-semibold">Acesso negado</h1>
      <p className="text-sm text-neutral-500 mt-2 max-w-sm">
        Você não possui permissão para acessar este módulo. Contate o administrador se acredita que isso é um erro.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="secondary">Voltar ao dashboard</Button>
      </Link>
    </div>
  )
}
