import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClassMap = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="flex min-h-full items-start justify-center py-4">
        <div className={`w-full ${sizeClassMap[size]} rounded-lg bg-white shadow-lg max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
      </div>
    </div>
  )
}
