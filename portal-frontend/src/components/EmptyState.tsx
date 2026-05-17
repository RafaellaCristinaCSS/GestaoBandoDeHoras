import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center">
      <InboxIcon size={48} className="text-slate-300 mb-4" />
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-slate-600 mt-2">{description}</p>}
    </div>
  )
}
