import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Users, ChevronDown, ChevronRight } from 'lucide-react'
import Select from 'react-select'
import { funcionarioService } from '@/services/funcionarioService'
import { escalaService } from '@/services/escalaService'
import { funcionarioEscalaService } from '@/services/funcionarioEscalaService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EscalaForm, EscalaFormData } from '@/components/EscalaForm'
import { useToast } from '@/contexts/ToastContext'
import { Escala, TipoEscala, CreateFuncionarioEscalaDTO } from '@/types/api'

const diasSemana = ['Segunda', 'TerÃ§a', 'Quarta', 'Quinta', 'Sexta', 'SÃ¡bado', 'Domingo']

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCompetenciaAtualInicio = (reference = new Date()) => {
  const year = reference.getFullYear()
  const month = reference.getMonth()

  if (reference.getDate() >= 21) {
    return new Date(year, month, 21)
  }

  return new Date(year, month - 1, 21)
}

const getProximaCompetenciaInicio = (reference = new Date()) => {
  const competenciaAtualInicio = getCompetenciaAtualInicio(reference)
  return new Date(competenciaAtualInicio.getFullYear(), competenciaAtualInicio.getMonth() + 1, 21)
}

const tipoEscalaLabel: Record<number, string> = {
  [TipoEscala.Semanal]: 'Semanal',
  [TipoEscala.Doze36]: '12x36',
  [TipoEscala.Personalizada]: 'Personalizada',
}

export function EscalasPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAtribuirModalOpen, setIsAtribuirModalOpen] = useState(false)
  const [editingEscala, setEditingEscala] = useState<Escala | null>(null)
  const [expandedEscalaId, setExpandedEscalaId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [atribuirEscalaId, setAtribuirEscalaId] = useState<number | null>(null)
  const [atribuirFuncionarioId, setAtribuirFuncionarioId] = useState<number | null>(null)
  const [atribuirDataInicio, setAtribuirDataInicio] = useState<string>(formatDateForInput(getCompetenciaAtualInicio()))
  const [trabalhaDiaPar, setTrabalhaDiaPar] = useState<boolean | null>(null)

  const { data: escalas, isLoading } = useQuery({
    queryKey: ['escalas'],
    queryFn: escalaService.getAll,
  })

  const { data: funcionarios } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const { data: historicoEscalasFuncionario } = useQuery({
    queryKey: ['funcionario-escalas', atribuirFuncionarioId],
    queryFn: () => funcionarioEscalaService.getByFuncionarioId(atribuirFuncionarioId!),
    enabled: isAtribuirModalOpen && !!atribuirFuncionarioId,
  })

  useEffect(() => {
    if (!isAtribuirModalOpen || !atribuirFuncionarioId) {
      return
    }

    if (!historicoEscalasFuncionario) {
      return
    }

    const dataSugerida = historicoEscalasFuncionario.length === 0
      ? getCompetenciaAtualInicio()
      : getProximaCompetenciaInicio()

    setAtribuirDataInicio(formatDateForInput(dataSugerida))
  }, [isAtribuirModalOpen, atribuirFuncionarioId, historicoEscalasFuncionario])

  const createMutation = useMutation({
    mutationFn: (data: EscalaFormData) =>
      escalaService.create({
        ...data,
        trabalhaDiaParPadrao: data.trabalhaDiaParPadrao ?? undefined,
        detalhes: data.detalhes.map(d => ({
          ...d,
          horaInicio: d.horaInicio ?? '',
          horaFim: d.horaFim ?? '',
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalas'] })
      setIsModalOpen(false)
      showToast('Escala criada com sucesso!', 'success')
    },
    onError: () => showToast('Erro ao criar escala', 'error'),
  })

  const syncEscalaDetalhes = async (escalaId: number, data: EscalaFormData, detalhesAtuais: Escala['detalhes']) => {
    const detalhesPorDia = new Map(detalhesAtuais.map((detalhe) => [detalhe.diaSemana, detalhe]))
    const diasRecebidos = new Set<number>()

    await Promise.all(
      data.detalhes.map(async (detalhe) => {
        diasRecebidos.add(detalhe.diaSemana)

        const payload = {
          horaInicio: detalhe.horaInicio ?? '',
          horaFim: detalhe.horaFim ?? '',
          horaAlmocoInicio: detalhe.horaAlmocoInicio ?? '',
          horaAlmocoFim: detalhe.horaAlmocoFim ?? '',
          horasPrevistas: detalhe.horasPrevistas,
          folga: detalhe.folga,
        }

        const detalheExistente = detalhesPorDia.get(detalhe.diaSemana)
        if (detalheExistente) {
          await escalaService.updateDetalhe(detalheExistente.id, payload)
          return
        }

        await escalaService.addDetalhe(escalaId, {
          diaSemana: detalhe.diaSemana,
          ...payload,
        })
      })
    )

    const detalhesRemovidos = detalhesAtuais.filter((detalhe) => !diasRecebidos.has(detalhe.diaSemana))
    await Promise.all(detalhesRemovidos.map((detalhe) => escalaService.deleteDetalhe(detalhe.id)))
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, detalhesAtuais }: { id: number; data: EscalaFormData; detalhesAtuais: Escala['detalhes'] }) => {
      await escalaService.update(id, {
        nome: data.nome,
        descricao: data.descricao,
        cargaHorariaSemanal: data.cargaHorariaSemanal,
        tipoEscala: data.tipoEscala,
        trabalhaDiaParPadrao: data.trabalhaDiaParPadrao ?? undefined,
        ativa: data.ativa,
      })

      await syncEscalaDetalhes(id, data, detalhesAtuais)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['escalas'] })
      await queryClient.invalidateQueries({ queryKey: ['registros-ponto'] })
      await queryClient.invalidateQueries({ queryKey: ['relatorio-geral'] })
      setIsModalOpen(false)
      setEditingEscala(null)
      showToast('Escala atualizada com sucesso!', 'success')
    },
    onError: () => showToast('Erro ao atualizar escala', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => escalaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalas'] })
      setDeleteConfirm(null)
      showToast('Escala desativada com sucesso!', 'success')
    },
    onError: () => showToast('Erro ao desativar escala', 'error'),
  })

  const atribuirMutation = useMutation({
    mutationFn: (dto: CreateFuncionarioEscalaDTO) => funcionarioEscalaService.assign(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-escalas'] })
      setIsAtribuirModalOpen(false)
      setAtribuirEscalaId(null)
      setAtribuirFuncionarioId(null)
      setAtribuirDataInicio(formatDateForInput(getCompetenciaAtualInicio()))
      setTrabalhaDiaPar(null)
      showToast('Escala atribuída com sucesso!', 'success')
    },
    onError: (error: any) => {
      const message = typeof error?.response?.data === 'string'
        ? error.response.data
        : 'Erro ao atribuir escala'
      showToast(message, 'error')
    },
  })

  const handleSubmit = async (data: EscalaFormData) => {
    if (editingEscala) {
      await updateMutation.mutateAsync({ id: editingEscala.id, data, detalhesAtuais: editingEscala.detalhes })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const handleAtribuir = async () => {
    if (!atribuirFuncionarioId || !atribuirEscalaId) return

    const escalaSelecionada = escalas?.find(e => e.id === atribuirEscalaId)
    if (escalaSelecionada?.tipoEscala === TipoEscala.Doze36 && trabalhaDiaPar === null) {
      showToast('Para escala 12x36, selecione se o funcionário trabalha em dias pares ou ímpares.', 'error')
      return
    }

    await atribuirMutation.mutateAsync({
      funcionarioId: atribuirFuncionarioId,
      escalaId: atribuirEscalaId,
      dataInicio: atribuirDataInicio,
      trabalhaDiaPar: escalaSelecionada?.tipoEscala === TipoEscala.Doze36 ? trabalhaDiaPar ?? undefined : undefined,
      createdByUserId: 0,
    })
  }

  const funcionarioOptions = funcionarios?.map(f => ({ value: f.id, label: f.nome })) ?? []

  if (isLoading) return <Loading />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Escalas</h1>
        <button
          onClick={() => { setEditingEscala(null); setIsModalOpen(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nova Escala
        </button>
      </div>

      {!escalas || escalas.length === 0 ? (
        <EmptyState
          title="Nenhuma escala cadastrada"
          description="Crie escalas centralizadas e atribua aos funcionÃ¡rios"
        />
      ) : (
        <div className="space-y-3">
          {escalas.map(escala => (
            <div key={escala.id} className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExpandedEscalaId(expandedEscalaId === escala.id ? null : escala.id)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    {expandedEscalaId === escala.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div>
                    <p className="font-semibold text-slate-900">{escala.nome}</p>
                    <p className="text-sm text-slate-500">
                      {tipoEscalaLabel[escala.tipoEscala]} Â· {escala.cargaHorariaSemanal}h/semana
                      {!escala.ativa && <span className="ml-2 text-red-500">(inativa)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAtribuirEscalaId(escala.id)
                      setAtribuirDataInicio(formatDateForInput(getCompetenciaAtualInicio()))
                      setTrabalhaDiaPar(escala.tipoEscala === TipoEscala.Doze36 ? escala.trabalhaDiaParPadrao ?? null : null)
                      setIsAtribuirModalOpen(true)
                    }}
                    className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
                  >
                    <Users size={16} />
                    Atribuir
                  </button>
                  <button
                    onClick={() => { setEditingEscala(escala); setIsModalOpen(true) }}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(escala.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    <Trash2 size={16} />
                    Desativar
                  </button>
                </div>
              </div>

              {expandedEscalaId === escala.id && (
                <div className="border-t px-6 py-4">
                  {escala.detalhes.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum horÃ¡rio configurado.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-600">Dia</th>
                          <th className="px-3 py-2 text-left text-slate-600">Entrada</th>
                          <th className="px-3 py-2 text-left text-slate-600">AlmoÃ§o</th>
                          <th className="px-3 py-2 text-left text-slate-600">SaÃ­da</th>
                          <th className="px-3 py-2 text-left text-slate-600">Horas</th>
                          <th className="px-3 py-2 text-left text-slate-600">Folga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[...escala.detalhes]
                          .sort((a, b) => a.diaSemana - b.diaSemana)
                          .map(d => (
                            <tr key={d.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-900">{diasSemana[d.diaSemana]}</td>
                              <td className="px-3 py-2 text-slate-600">{d.folga ? '-' : d.horaInicio}</td>
                              <td className="px-3 py-2 text-slate-600">
                                {d.folga ? '-' : d.horaAlmocoInicio && d.horaAlmocoFim ? `${d.horaAlmocoInicio} - ${d.horaAlmocoFim}` : '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{d.folga ? '-' : d.horaFim}</td>
                              <td className="px-3 py-2 text-slate-600">{d.folga ? '-' : `${d.horasPrevistas}h`}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.folga ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                  {d.folga ? 'Sim' : 'NÃ£o'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar escala */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEscala(null) }}
        title={editingEscala ? 'Editar Escala' : 'Nova Escala'}
        size="2xl"
      >
        <EscalaForm
          onSubmit={handleSubmit}
          initialData={editingEscala ?? undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Modal atribuir escala a funcionÃ¡rio */}
      <Modal
        isOpen={isAtribuirModalOpen}
        onClose={() => {
          setIsAtribuirModalOpen(false)
          setAtribuirFuncionarioId(null)
          setAtribuirDataInicio(formatDateForInput(getCompetenciaAtualInicio()))
          setTrabalhaDiaPar(null)
        }}
        title="Atribuir Escala ao FuncionÃ¡rio"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">FuncionÃ¡rio *</label>
            <Select
              options={funcionarioOptions}
              isClearable
              isSearchable
              placeholder="Selecione o funcionÃ¡rio..."
              noOptionsMessage={() => 'Nenhum funcionÃ¡rio encontrado'}
              onChange={opt => setAtribuirFuncionarioId(opt?.value ?? null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data de inÃ­cio *</label>
            <input
              type="date"
              value={atribuirDataInicio}
              onChange={e => setAtribuirDataInicio(e.target.value)}
              min={historicoEscalasFuncionario && historicoEscalasFuncionario.length > 0 ? formatDateForInput(getProximaCompetenciaInicio()) : undefined}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              {historicoEscalasFuncionario && historicoEscalasFuncionario.length > 0
                ? `Funcionário com escala já vinculada: nova atribuição a partir de ${formatDateForInput(getProximaCompetenciaInicio())}.`
                : `Primeira escala do funcionário: pode iniciar na competência atual, desde ${formatDateForInput(getCompetenciaAtualInicio())}.`}
            </p>
          </div>
          {escalas?.find(e => e.id === atribuirEscalaId)?.tipoEscala === TipoEscala.Doze36 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ciclo 12x36 *</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="paridade12x36"
                    checked={trabalhaDiaPar === true}
                    onChange={() => setTrabalhaDiaPar(true)}
                  />
                  Trabalha em dias pares
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="paridade12x36"
                    checked={trabalhaDiaPar === false}
                    onChange={() => setTrabalhaDiaPar(false)}
                  />
                  Trabalha em dias impares
                </label>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAtribuirModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAtribuir}
              disabled={!atribuirFuncionarioId || atribuirMutation.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {atribuirMutation.isPending ? 'Atribuindo...' : 'Atribuir'}
            </button>
          </div>
        </div>
      </Modal>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen
          title="Desativar escala"
          message="Tem certeza que deseja desativar essa escala? Ela nÃ£o ficarÃ¡ mais disponÃ­vel para novas atribuiÃ§Ãµes."
          onConfirm={() => deleteMutation.mutate(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

