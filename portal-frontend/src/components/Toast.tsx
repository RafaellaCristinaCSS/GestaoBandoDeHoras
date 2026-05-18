import { AlertCircle, CheckCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  const bgColor = {
    success: 'bg-emerald-50 border-emerald-300',
    error: 'bg-rose-50 border-rose-300',
    info: 'bg-sky-50 border-sky-300',
  }[type]

  const textColor = {
    success: 'text-emerald-800',
    error: 'text-rose-800',
    info: 'text-sky-800',
  }[type]

  const Icon = type === 'error' ? AlertCircle : CheckCircle

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-sm ${bgColor} ${textColor}`}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto text-lg leading-none opacity-70 hover:opacity-100" aria-label="Fechar notificação">&times;</button>
    </div>
  )
}
