import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { escalaService } from '@/services/escalaService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Toast } from '@/components/Toast'

const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function RegistroPontoPage() {
  const queryClient = useQueryClient()
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  // const [editingId, setEditingId] = useState<number | null>(null)
  // const [editingField, setEditingField] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { data: funcionarios, isLoading: isLoadingFunc } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const { data: registros, isLoading: isLoadingRegistros } = useQuery({
    queryKey: ['registros-ponto', selectedFuncionarioId, selectedMonth, selectedYear],
    queryFn: () =>
      selectedFuncionarioId
        ? registroPontoService.getAll(selectedFuncionarioId, selectedMonth, selectedYear)
        : Promise.resolve([]),
    enabled: !!selectedFuncionarioId,
  })

  const { data: _escalas } = useQuery({
    queryKey: ['escalas', selectedFuncionarioId],
    queryFn: () =>
      selectedFuncionarioId ? escalaService.getByFuncionarioId(selectedFuncionarioId) : Promise.resolve([]),
    enabled: !!selectedFuncionarioId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: number; field: string; value: string | boolean }) =>
      registroPontoService.update(id, { [field]: value } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['registros-ponto', selectedFuncionarioId, selectedMonth, selectedYear],
      })
      // setEditingId(null)
      // setEditingField(null)
      setToast({ message: 'Atualizado com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao atualizar', type: 'error' })
    },
  })

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  // const formatDate = (year: number, month: number, day: number) => {
  //   return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  // }

  const handleCellChange = (registroId: number, field: string, value: string | boolean) => {
    updateMutation.mutate({ id: registroId, field, value })
  }

  const selectedFuncionario = funcionarios?.find((f) => f.id === selectedFuncionarioId)
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
  // const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  if (isLoadingFunc) return <Loading />

  return (
    <div>
      {toast && (
        <div className="mb-4">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Registro de Ponto</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Funcionário *
              </label>
              <select
                value={selectedFuncionarioId || ''}
                onChange={(e) => {
                  setSelectedFuncionarioId(e.target.value ? Number(e.target.value) : null)
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                <option value="">-- Selecione --</option>
                {funcionarios?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mês *</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ano *</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                {[...Array(3)].map((_, i) => {
                  const year = new Date().getFullYear() - 1 + i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedFuncionario && (
        <>
          {isLoadingRegistros ? (
            <Loading />
          ) : !registros || registros.length === 0 ? (
            <EmptyState
              title="Nenhum registro de ponto"
              description={`Nenhum registro para ${selectedFuncionario.nome} em ${selectedMonth}/${selectedYear}`}
            />
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Data</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Dia</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Entrada</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Almoço Ini.</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Almoço Fim</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Saída</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Presença</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Obs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {registros.map((registro) => (
                    <tr key={registro.id} className="hover:bg-slate-50">
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
                          defaultValue={registro.entrada || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (registro.entrada || '')) {
                              handleCellChange(registro.id, 'entrada', e.target.value)
                            }
                          }}
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          defaultValue={registro.almocInicio || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (registro.almocInicio || '')) {
                              handleCellChange(registro.id, 'almocInicio', e.target.value)
                            }
                          }}
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          defaultValue={registro.almocFim || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (registro.almocFim || '')) {
                              handleCellChange(registro.id, 'almocFim', e.target.value)
                            }
                          }}
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          defaultValue={registro.saida || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (registro.saida || '')) {
                              handleCellChange(registro.id, 'saida', e.target.value)
                            }
                          }}
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={registro.presenca}
                          onChange={(e) => {
                            handleCellChange(registro.id, 'presenca', e.target.checked)
                          }}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            registro.status === 'Presente'
                              ? 'bg-green-100 text-green-800'
                              : registro.status === 'Falta'
                                ? 'bg-red-100 text-red-800'
                                : registro.status === 'Folga'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {registro.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          defaultValue={registro.observacao || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (registro.observacao || '')) {
                              handleCellChange(registro.id, 'observacao', e.target.value)
                            }
                          }}
                          className="w-32 rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Obs."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
