import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  isOpen,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={24} className="text-yellow-600" />
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
