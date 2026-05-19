import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2 } from 'lucide-react'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { FuncionarioForm, FuncionarioFormData } from '@/components/FuncionarioForm'
import { Funcionario } from '@/types/api'
import { Toast } from '@/components/Toast'

type SortField = 'nome' | 'cargo' | 'escalaNome' | 'ativo'
type SortDirection = 'asc' | 'desc'

export function FuncionariosPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('nome')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const pageSize = 10

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
    mutationFn: async ({
      id,
      data,
      regenerarRegistros,
    }: {
      id: number
      data: FuncionarioFormData
      regenerarRegistros: boolean
    }) => {
      await funcionarioService.update(id, data)

      if (!regenerarRegistros) {
        return
      }

      const agora = new Date()
      const mesCompetencia = agora.getMonth() + 1
      const anoCompetencia = agora.getFullYear()

      // Forca a rotina de preenchimento/reaplicacao da escala para a competencia atual.
      await registroPontoService.getAll(id, mesCompetencia, anoCompetencia)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      queryClient.invalidateQueries({ queryKey: ['registros-ponto'] })
      setIsModalOpen(false)
      setEditingId(null)
      setToast({ message: 'Funcionário atualizado com sucesso!', type: 'success' })
    },
    onError: () => {
      setToast({ message: 'Erro ao atualizar funcionário', type: 'error' })
    },
  })

  const handleEdit = (funcionario: Funcionario) => {
    setEditingId(funcionario.id)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: any) => {
    if (editingId) {
      const funcionarioAntesDaEdicao = funcionarios?.find((funcionario) => funcionario.id === editingId)
      const estavaSemEscala = !funcionarioAntesDaEdicao?.escalaId
      const possuiEscalaNoEnvio = Boolean(data.escalaId)

      updateMutation.mutate({
        id: editingId,
        data,
        regenerarRegistros: estavaSemEscala && possuiEscalaNoEnvio,
      })
    } else {
      createMutation.mutate(data)
    }
  }

  const editingFuncionario = editingId
    ? funcionarios?.find((f) => f.id === editingId)
    : undefined

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortField, sortDirection])

  const filteredFuncionarios = (funcionarios ?? []).filter((funcionario) =>
    funcionario.nome.toLowerCase().includes(searchTerm.trim().toLowerCase())
  )

  const sortedFuncionarios = [...filteredFuncionarios].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1

    if (sortField === 'ativo') {
      if (a.ativo === b.ativo) return a.nome.localeCompare(b.nome, 'pt-BR') * direction
      return (a.ativo ? 1 : 0) > (b.ativo ? 1 : 0) ? direction : -direction
    }

    const valueA = (a[sortField] ?? '').toString()
    const valueB = (b[sortField] ?? '').toString()
    return valueA.localeCompare(valueB, 'pt-BR', { sensitivity: 'base' }) * direction
  })

  const totalPages = Math.max(1, Math.ceil(sortedFuncionarios.length / pageSize))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const paginatedFuncionarios = sortedFuncionarios.slice(
    (currentPageSafe - 1) * pageSize,
    currentPageSafe * pageSize
  )

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
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-md">
              <label className="block text-sm font-medium text-slate-700">Pesquisar funcionário</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Digite o nome do funcionário"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ordenar por</label>
                <select
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value as SortField)}
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="nome">Nome</option>
                  <option value="cargo">Cargo</option>
                  <option value="escalaNome">Escala</option>
                  <option value="ativo">Status</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Direção</label>
                <select
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </select>
              </div>
            </div>
          </div>

          {filteredFuncionarios.length === 0 ? (
            <EmptyState
              title="Nenhum funcionário encontrado"
              description="Ajuste a pesquisa para localizar outro funcionário"
            />
          ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Cargo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Escala</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedFuncionarios.map((func) => (
                  <tr key={func.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{func.nome}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{func.cargo}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{func.escalaNome ?? '-'}</td>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-600">
              Página {currentPageSafe} de {totalPages} · {sortedFuncionarios.length} resultado(s)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPageSafe === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentPageSafe === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
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
    </div>
  )
}
