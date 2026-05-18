import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { funcionarioService } from '@/services/funcionarioService'
import { feriasService } from '@/services/feriasService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Toast } from '@/components/Toast'
import { Ferias } from '@/types/api'

export function FeriasPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; funcionario: string } | null>(
    null
  )
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { data: ferias, isLoading: isLoadingFerias, isError } = useQuery({
    queryKey: ['ferias'],
    queryFn: feriasService.getAll,
  })

  const { data: funcionarios } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => feriasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ferias'] })
      setDeleteConfirm(null)
      setToast({ message: 'Férias removida com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao remover férias', type: 'error' })
    },
  })

  const handleEdit = (feria: Ferias) => {
    setEditingId(feria.id)
    setIsModalOpen(true)
  }

  // const editingFeria = editingId ? ferias?.find((f) => f.id === editingId) : undefined

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const getFuncionarioNome = (id: number) => {
    return funcionarios?.find((f) => f.id === id)?.nome || 'Desconhecido'
  }

  if (isLoadingFerias) return <Loading />

  if (isError) {
    return <EmptyState title="Erro ao carregar férias" />
  }

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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Férias</h1>
        <button
          onClick={() => {
            setEditingId(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Adicionar Férias
        </button>
      </div>

      {!ferias || ferias.length === 0 ? (
        <EmptyState
          title="Nenhuma férias cadastrada"
          description="Clique em 'Adicionar Férias' para começar"
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Data Início
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Data Fim
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Dias
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Observação
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ferias.map((feria) => {
                const dias = Math.ceil(
                  (new Date(feria.dataFim).getTime() - new Date(feria.dataInicio).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                return (
                  <tr key={feria.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {getFuncionarioNome(feria.funcionarioId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(feria.dataInicio).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(feria.dataFim).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{dias} dias</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {feria.observacao || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(feria)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: feria.id,
                              funcionario: getFuncionarioNome(feria.funcionarioId),
                            })
                          }
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar Férias' : 'Adicionar Férias'}
      >
        <div className="text-center text-slate-600">
          <p>Formulário de férias - em desenvolvimento</p>
        </div>
      </Modal>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen
          title="Confirmar exclusão"
          message={`Tem certeza que deseja remover as férias de ${deleteConfirm.funcionario}?`}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
