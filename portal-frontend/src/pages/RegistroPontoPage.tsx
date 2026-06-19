import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Select from 'react-select'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Toast } from '@/components/Toast'
import { RegistroPontoDesktopTable } from '@/pages/registro/RegistroPontoDesktopTable'
import { RegistroPontoMobileList } from '@/pages/registro/RegistroPontoMobileList'
import {
  buildStatusPayload,
  getDefaultPeriod,
  parseLocalDate,
} from '@/pages/registro/registroPontoUtils'

export function RegistroPontoPage() {
  const queryClient = useQueryClient()
  const defaultPeriod = getDefaultPeriod()
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState(defaultPeriod.startDate)
  const [endDate, setEndDate] = useState(defaultPeriod.endDate)
  // const [editingId, setEditingId] = useState<number | null>(null)
  // const [editingField, setEditingField] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const isDateRangeInvalid = Boolean(startDate && endDate && parseLocalDate(startDate) > parseLocalDate(endDate))

  const { data: funcionarios, isLoading: isLoadingFunc } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const { data: registros, isLoading: isLoadingRegistros } = useQuery({
    queryKey: ['registros-ponto', selectedFuncionarioId, startDate, endDate],
    queryFn: () =>
      selectedFuncionarioId
        ? registroPontoService.getAll(selectedFuncionarioId, undefined, undefined, startDate, endDate)
        : Promise.resolve([]),
    enabled: !!selectedFuncionarioId && !isDateRangeInvalid,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, string | boolean> }) =>
      registroPontoService.update(id, data as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['registros-ponto', selectedFuncionarioId, startDate, endDate],
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
    const registroAtual = registros?.find((registro) => registro.id === registroId)

    let preserveStatusFlags: Record<string, string | boolean> = {}
    if (registroAtual?.status === 'Feriado') {
      preserveStatusFlags = { folga: false, feriado: true, atestadoMedico: false, ferias: false, presenca: false }
    } else if (registroAtual?.status === 'Atestado Médico') {
      preserveStatusFlags = { folga: false, feriado: false, atestadoMedico: true, ferias: false, presenca: false }
    } else if (registroAtual?.status === 'Folga') {
      preserveStatusFlags = { folga: true, feriado: false, atestadoMedico: false, ferias: false, presenca: false }
    } else if (registroAtual?.status === 'Férias') {
      preserveStatusFlags = { folga: false, feriado: false, atestadoMedico: false, ferias: true, presenca: false }
    }

    updateMutation.mutate({
      id: registroId,
      data: {
        ...preserveStatusFlags,
        [field]: value,
      },
    })
  }

  const handleStatusChange = (registroId: number, status: string) => {
    updateMutation.mutate({ id: registroId, data: buildStatusPayload(status) })
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Data início *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data fim *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-600">
            Período padrão: 21 do mês anterior até 20 do mês atual. Você pode alterar conforme a necessidade.
          </div>

          {isDateRangeInvalid && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              A data inicial não pode ser maior que a data final.
            </div>
          )}
        </div>
      </div>

      {selectedFuncionario && (
        <>
          {isLoadingRegistros ? (
            <Loading />
          ) : !registros || registros.length === 0 ? (
            <EmptyState
              title="Nenhum registro de ponto"
              description={`Nenhum registro para ${selectedFuncionario.nome} entre ${parseLocalDate(startDate).toLocaleDateString('pt-BR')} e ${parseLocalDate(endDate).toLocaleDateString('pt-BR')}`}
            />
          ) : (
            <div className="rounded-lg bg-white shadow">
              <RegistroPontoMobileList
                registros={registros}
                onCellChange={handleCellChange}
                onStatusChange={handleStatusChange}
              />

              <RegistroPontoDesktopTable
                registros={registros}
                onCellChange={handleCellChange}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
