import { Card } from '@/components/ui/Card'

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`admin-loading-card-${index}`}>
            <div className="h-16 animate-pulse rounded bg-slate-800/70" />
          </Card>
        ))}
      </div>

      <Card>
        <div className="h-48 animate-pulse rounded bg-slate-800/70" />
      </Card>
    </div>
  )
}
