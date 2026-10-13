import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

export function PlaceholderPage({ title, description, phase }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {phase && <Badge>Fase {phase}</Badge>}
      </div>
      <p className="text-sm text-neutral-500 max-w-xl">{description}</p>
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm text-neutral-400">Módulo em desenvolvimento</p>
        </CardContent>
      </Card>
    </div>
  )
}
