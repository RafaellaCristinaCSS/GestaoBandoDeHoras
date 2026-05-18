import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { funcionarioService } from '@/services/funcionarioService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FuncionarioForm, FuncionarioFormData } from '@/components/FuncionarioForm'
import { Funcionario } from '@/types/api'
import { Toast } from '@/components/Toast'

export function FuncionariosPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { data: funcionarios, isLoading, isError } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (data: FuncionarioFormData) => funcionarioService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      setIsModalOpen(false)
      setEditingId(null)
      setToast({ message: 'Funcionário criado com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao criar funcionário', type: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FuncionarioFormData }) =>
      funcionarioService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      setIsModalOpen(false)
      setEditingId(null)
      setToast({ message: 'Funcionário atualizado com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao atualizar funcionário', type: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => funcionarioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      setDeleteConfirm(null)
      setToast({ message: 'Funcionário removido com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao remover funcionário', type: 'error' })
    },
  })

  const handleEdit = (funcionario: Funcionario) => {
    setEditingId(funcionario.id)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const editingFuncionario = editingId
    ? funcionarios?.find((f) => f.id === editingId)
    : undefined

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  if (isLoading) return <Loading />

  if (isError) {
    return <EmptyState title="Erro ao carregar funcionários" />
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
        <h1 className="text-3xl font-bold text-slate-900">Funcionários</h1>
        <button
          onClick={() => {
            setEditingId(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Novo Funcionário
        </button>
      </div>

      {!funcionarios || funcionarios.length === 0 ? (
        <EmptyState
          title="Nenhum funcionário cadastrado"
          description="Clique em 'Novo Funcionário' para começar"
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Cargo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Carga Horária
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {funcionarios.map((func) => (
                <tr key={func.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{func.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{func.cargo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{func.cargaHorariaSemanal}h</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        func.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {func.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(func)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: func.id, name: func.nome })}
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
      >
        <FuncionarioForm
          initialData={editingFuncionario}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen
          title="Confirmar exclusão"
          message={`Tem certeza que deseja remover ${deleteConfirm.name}?`}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
