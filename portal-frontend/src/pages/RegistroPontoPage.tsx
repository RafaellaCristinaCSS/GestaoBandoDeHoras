import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Select from 'react-select'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Toast } from '@/components/Toast'
import { RegistroPonto } from '@/types/api'

const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const isToday = (isoDate: string) => {
  const data = parseLocalDate(isoDate)
  const hoje = new Date()

  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  )
}

const toMinutes = (time?: string) => {
  if (!time) return null

  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

const getHorasTrabalhadas = (registro: RegistroPonto) => {
  const entrada = toMinutes(registro.entrada)
  const saida = toMinutes(registro.saida)

  if (entrada == null || saida == null || saida <= entrada) return null

  let total = saida - entrada
  const almocoInicio = toMinutes(registro.almocInicio)
  const almocoFim = toMinutes(registro.almocFim)

  if (
    almocoInicio != null &&
    almocoFim != null &&
    almocoFim > almocoInicio &&
    almocoInicio >= entrada &&
    almocoFim <= saida
  ) {
    total -= almocoFim - almocoInicio
  }

  return total / 60
}

const getHorasPlanejadas = (registro: RegistroPonto) => (registro.status === 'Feriado' ? 0 : registro.horasPrevistas ?? null)

const normalizeRegistro = (registro: RegistroPonto): RegistroPonto => {
  if (registro.feriado) return registro

  const isFolgaDoze36 = registro.status === 'Folga'

  if (isFolgaDoze36) {
    return {
      ...registro,
      status: 'Folga',
      presenca: false,
      entrada: '',
      almocInicio: '',
      almocFim: '',
      saida: '',
      horasPrevistas: 0,
    }
  }

  return registro
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, string | boolean> }) =>
      registroPontoService.update(id, data as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['registros-ponto', selectedFuncionarioId, selectedMonth, selectedYear],
      })
      await queryClient.invalidateQueries({
        queryKey: ['relatorio-geral'],
      })
      // setEditingId(null)
      // setEditingField(null)
      setToast({ message: 'Atualizado com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao atualizar', type: 'error' })
    },
  })

  // const formatDate = (year: number, month: number, day: number) => {
  //   return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  // }

  const handleCellChange = (registroId: number, field: string, value: string | boolean) => {
    updateMutation.mutate({ id: registroId, data: { [field]: value } })
  }

  const handleStatusChange = (registroId: number, status: string) => {
    if (status === 'Feriado') {
      updateMutation.mutate({
        id: registroId,
        data: {
          feriado: true,
          presenca: false,
          entrada: '',
          almocInicio: '',
          almocFim: '',
          saida: '',
        },
      })
      return
    }

    if (status === 'Falta') {
      updateMutation.mutate({
        id: registroId,
        data: {
          feriado: false,
          presenca: false,
        },
      })
      return
    }

    updateMutation.mutate({
      id: registroId,
      data: {
        feriado: false,
        presenca: true,
      },
    })
  }

  const selectedFuncionario = funcionarios?.find((f) => f.id === selectedFuncionarioId)
  const funcionarioOptions =
    funcionarios?.map((f) => ({ value: f.id, label: f.nome })) ?? []
  const selectedFuncionarioOption =
    funcionarioOptions.find((o) => o.value === selectedFuncionarioId) ?? null
  // const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  if (isLoadingFunc) return <Loading />

  return (
    <div className="px-4 pb-6 sm:px-6">
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
        <h1 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">Registro de Ponto</h1>

        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Funcionário *
              </label>
              <Select
                options={funcionarioOptions}
                value={selectedFuncionarioOption}
                isClearable
                isSearchable
                placeholder="Buscar funcionário..."
                noOptionsMessage={() => 'Nenhum funcionário encontrado'}
                onChange={(option) => {
                  setSelectedFuncionarioId(option?.value ?? null)
                }}
              />
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
            <div className="rounded-lg bg-white shadow">
              <div className="space-y-4 p-4 md:hidden">
                {registros.map((registroOriginal) => {
                  const registro = normalizeRegistro(registroOriginal)
                  const horasTrabalhadas = getHorasTrabalhadas(registro)
                  const horasPlanejadas = getHorasPlanejadas(registro)
                  const saldoHoras =
                    horasTrabalhadas != null && horasPlanejadas != null
                      ? horasTrabalhadas - horasPlanejadas
                      : null
                  const linhaDiaAtual = isToday(registro.data)
                  const isFolga = registroOriginal.status === 'Folga'

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
                            defaultValue={registro.entrada || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (registro.entrada || '')) {
                                handleCellChange(registro.id, 'entrada', e.target.value)
                              }
                            }}
                            disabled={isFolga}
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Saída
                          <input
                            type="time"
                            defaultValue={registro.saida || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (registro.saida || '')) {
                                handleCellChange(registro.id, 'saida', e.target.value)
                              }
                            }}
                            disabled={isFolga}
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Almoço início
                          <input
                            type="time"
                            defaultValue={registro.almocInicio || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (registro.almocInicio || '')) {
                                handleCellChange(registro.id, 'almocInicio', e.target.value)
                              }
                            }}
                            disabled={isFolga}
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Almoço fim
                          <input
                            type="time"
                            defaultValue={registro.almocFim || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (registro.almocFim || '')) {
                                handleCellChange(registro.id, 'almocFim', e.target.value)
                              }
                            }}
                            disabled={isFolga}
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                          />
                        </label>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div>
                          <div className="mb-1 text-xs font-medium text-slate-600">Status</div>
                          {isFolga ? (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                              Folga
                            </span>
                          ) : (
                            <select
                              value={registro.status}
                              onChange={(e) => handleStatusChange(registro.id, e.target.value)}
                              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                            >
                              <option value="Presente">Presente</option>
                              <option value="Falta">Falta</option>
                              <option value="Feriado">Feriado</option>
                            </select>
                          )}
                        </div>

                        <label className="text-xs font-medium text-slate-600">
                          Observação
                          <input
                            type="text"
                            defaultValue={registro.observacao || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (registro.observacao || '')) {
                                handleCellChange(registro.id, 'observacao', e.target.value)
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
                    {registros.map((registroOriginal) => {
                      const registro = normalizeRegistro(registroOriginal)
                      const horasTrabalhadas = getHorasTrabalhadas(registro)
                      const horasPlanejadas = getHorasPlanejadas(registro)
                      const saldoHoras =
                        horasTrabalhadas != null && horasPlanejadas != null
                          ? horasTrabalhadas - horasPlanejadas
                          : null
                      const linhaDiaAtual = isToday(registro.data)
                      const isFolga = registroOriginal.status === 'Folga'

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
                              defaultValue={registro.entrada || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (registro.entrada || '')) {
                                  handleCellChange(registro.id, 'entrada', e.target.value)
                                }
                              }}
                              disabled={isFolga}
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
                              disabled={isFolga}
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
                              disabled={isFolga}
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
                              disabled={isFolga}
                              className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {isFolga ? (
                              <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                                Folga
                              </span>
                            ) : (
                              <select
                                value={registro.status}
                                onChange={(e) => handleStatusChange(registro.id, e.target.value)}
                                className="rounded border border-slate-300 px-2 py-1 text-xs"
                              >
                                <option value="Presente">Presente</option>
                                <option value="Falta">Falta</option>
                                <option value="Feriado">Feriado</option>
                              </select>
                            )}
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
                                  handleCellChange(registro.id, 'observacao', e.target.value)
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
            </div>
          )}
        </>
      )}
    </div>
  )
}
