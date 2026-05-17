import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { funcionarioService } from '@/services/funcionarioService'
import { escalaService } from '@/services/escalaService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EscalaForm, EscalaFormData } from '@/components/EscalaForm'
import { Toast } from '@/components/Toast'
import { Escala } from '@/types/api'

const diasSemana = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
]

export function EscalasPage() {
  const queryClient = useQueryClient()
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { data: funcionarios, isLoading: isLoadingFunc } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const { data: escalas, isLoading: isLoadingEscalas } = useQuery({
    queryKey: ['escalas', selectedFuncionarioId],
    queryFn: () =>
      selectedFuncionarioId
        ? escalaService.getByFuncionarioId(selectedFuncionarioId)
        : Promise.resolve([]),
    enabled: !!selectedFuncionarioId,
  })

  const createMutation = useMutation({
    mutationFn: (data: EscalaFormData & { funcionarioId: number }) =>
      escalaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['escalas', selectedFuncionarioId],
      })
      setIsModalOpen(false)
      setEditingId(null)
      setToast({ message: 'Escala criada com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao criar escala', type: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EscalaFormData> }) =>
      escalaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['escalas', selectedFuncionarioId],
      })
      setIsModalOpen(false)
      setEditingId(null)
      setToast({ message: 'Escala atualizada com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao atualizar escala', type: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => escalaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['escalas', selectedFuncionarioId],
      })
      setDeleteConfirm(null)
      setToast({ message: 'Escala removida com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao remover escala', type: 'error' })
    },
  })

  const handleSubmit = (data: EscalaFormData & { funcionarioId: number }) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const selectedFuncionario = funcionarios?.find((f) => f.id === selectedFuncionarioId)
  const editingEscala = editingId ? escalas?.find((e) => e.id === editingId) : undefined

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

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
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Escalas</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Selecione um funcionário *
          </label>
          <select
            value={selectedFuncionarioId || ''}
            onChange={(e) => {
              setSelectedFuncionarioId(e.target.value ? Number(e.target.value) : null)
              setEditingId(null)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          >
            <option value="">-- Selecione um funcionário --</option>
            {funcionarios?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedFuncionario && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Escala de {selectedFuncionario.nome}
            </h2>
            <button
              onClick={() => {
                setEditingId(null)
                setIsModalOpen(true)
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Adicionar Escala
            </button>
          </div>

          {isLoadingEscalas ? (
            <Loading />
          ) : !escalas || escalas.length === 0 ? (
            <EmptyState
              title="Nenhuma escala cadastrada"
              description="Clique em 'Adicionar Escala' para definir os horários de trabalho"
            />
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Dia
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Saída
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Horas
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Folga
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {escalas.map((escala) => (
                    <tr key={escala.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {diasSemana[escala.diaSemana]}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {escala.folga ? '-' : escala.horaInicio}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {escala.folga ? '-' : escala.horaFim}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {escala.folga ? '-' : escala.horasPrevistas}h
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            escala.folga
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {escala.folga ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditingId(escala.id)
                              setIsModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Edit2 size={16} />
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(escala.id)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedFuncionarioId && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingId ? 'Editar Escala' : 'Adicionar Escala'}
        >
          <EscalaForm
            funcionarioId={selectedFuncionarioId}
            initialData={editingEscala}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen
          title="Confirmar exclusão"
          message="Tem certeza que deseja remover essa escala?"
          onConfirm={() => deleteMutation.mutate(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
