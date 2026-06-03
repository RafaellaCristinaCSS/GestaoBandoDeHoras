import { RegistroPonto } from '@/types/api'
import {
  STATUS_OPTIONS,
  getHorasPlanejadas,
  getHorasTrabalhadas,
  isToday,
  parseLocalDate,
} from './registroPontoUtils'

type Props = {
  registros: RegistroPonto[]
  onCellChange: (registroId: number, field: string, value: string | boolean) => void
  onStatusChange: (registroId: number, status: string) => void
}

export function RegistroPontoMobileList({ registros, onCellChange, onStatusChange }: Props) {
  return (
    <div className="space-y-4 p-4 md:hidden">
      {registros.map((registro) => {
        const horasTrabalhadas = getHorasTrabalhadas(registro)
        const horasPlanejadas = getHorasPlanejadas(registro)
        const saldoHoras =
          horasTrabalhadas != null && horasPlanejadas != null
            ? horasTrabalhadas - horasPlanejadas
            : null
        const linhaDiaAtual = isToday(registro.data)

        return (
          <div
            key={registro.id}
            className={`rounded-xl border p-4 shadow-sm ${
              linhaDiaAtual ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {parseLocalDate(registro.data).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {parseLocalDate(registro.data).toLocaleString('pt-BR', { weekday: 'long' })}
                </div>
              </div>
              {saldoHoras == null ? (
                <span className="text-xs text-slate-500">-</span>
              ) : (
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold ${
                    saldoHoras < 0
                      ? 'bg-red-100 text-red-800'
                      : saldoHoras > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {horasTrabalhadas!.toFixed(1)}h / {horasPlanejadas!.toFixed(1)}h
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-600">
                Entrada
                <input
                  type="time"
                  value={registro.entrada || ''}
                  onChange={(e) => onCellChange(registro.id, 'entrada', e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Saída
                <input
                  type="time"
                  value={registro.saida || ''}
                  onChange={(e) => onCellChange(registro.id, 'saida', e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Almoço início
                <input
                  type="time"
                  value={registro.almocInicio || ''}
                  onChange={(e) => onCellChange(registro.id, 'almocInicio', e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Almoço fim
                <input
                  type="time"
                  value={registro.almocFim || ''}
                  onChange={(e) => onCellChange(registro.id, 'almocFim', e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-600">Status</div>
                <select
                  value={registro.status}
                  onChange={(e) => onStatusChange(registro.id, e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <label className="text-xs font-medium text-slate-600">
                Observação
                <input
                  type="text"
                  defaultValue={registro.observacao || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (registro.observacao || '')) {
                      onCellChange(registro.id, 'observacao', e.target.value)
                    }
                  }}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Obs."
                />
              </label>
            </div>
          </div>
        )
      })}
    </div>
  )
}
