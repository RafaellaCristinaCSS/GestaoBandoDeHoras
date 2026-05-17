import { AlertCircle, CheckCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  const bgColor = {
    success: 'bg-green-100 border-green-300',
    error: 'bg-red-100 border-red-300',
    info: 'bg-blue-100 border-blue-300',
  }[type]

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[type]

  const Icon = type === 'error' ? AlertCircle : CheckCircle

  return (
    <div className={`border rounded-lg p-4 ${bgColor} ${textColor} flex items-gap-3 gap-3`}>
      <Icon size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto text-lg">&times;</button>
    </div>
  )
}
