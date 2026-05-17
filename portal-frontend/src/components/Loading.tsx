import { Loader } from 'lucide-react'

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <Loader className="animate-spin mx-auto mb-2" size={40} />
        <p className="text-slate-600">Carregando...</p>
      </div>
    </div>
  )
}
