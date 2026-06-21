import { RegistroPonto } from '@/types/api'
import {
  STATUS_OPTIONS,
  bloqueiaHorarios,
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

export function RegistroPontoDesktopTable({ registros, onCellChange, onStatusChange }: Props) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[920px] text-sm">
        <thead className="sticky top-0 border-b bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Data</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Dia</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Entrada</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Almoço Ini.</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Almoço Fim</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Saída</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Horas</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Obs.</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {registros.map((registro) => {
            const horasTrabalhadas = getHorasTrabalhadas(registro)
            const horasPlanejadas = getHorasPlanejadas(registro)
            const saldoHoras =
              horasTrabalhadas != null && horasPlanejadas != null
                ? horasTrabalhadas - horasPlanejadas
                : null
            const linhaDiaAtual = isToday(registro.data)
            const horariosBloqueados = bloqueiaHorarios(registro.status)

            return (
              <tr
                key={registro.id}
                className={linhaDiaAtual ? 'bg-amber-50/70 hover:bg-amber-100/70' : 'hover:bg-slate-50'}
              >
                <td className="px-4 py-3 text-slate-900">
                  {parseLocalDate(registro.data).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {parseLocalDate(registro.data).toLocaleString('pt-BR', {
                    weekday: 'short',
                  })}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={registro.entrada || ''}
                    disabled={horariosBloqueados}
                    onChange={(e) => onCellChange(registro.id, 'entrada', e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={registro.almocInicio || ''}
                    disabled={horariosBloqueados}
                    onChange={(e) => onCellChange(registro.id, 'almocInicio', e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={registro.almocFim || ''}
                    disabled={horariosBloqueados}
                    onChange={(e) => onCellChange(registro.id, 'almocFim', e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={registro.saida || ''}
                    disabled={horariosBloqueados}
                    onChange={(e) => onCellChange(registro.id, 'saida', e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={registro.status}
                    onChange={(e) => onStatusChange(registro.id, e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    defaultValue={registro.observacao || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (registro.observacao || '')) {
                        onCellChange(registro.id, 'observacao', e.target.value)
                      }
                    }}
                    className="w-32 rounded border border-slate-300 px-2 py-1 text-xs"
                    placeholder="Obs."
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
