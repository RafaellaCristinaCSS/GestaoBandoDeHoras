import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Select from 'react-select'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Toast } from '@/components/Toast'

export function RelatoriosPage() {
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

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

  const handleExportExcel = async () => {
    if (!registros || registros.length === 0) {
      setToast({ message: 'Nenhum dado para exportar', type: 'error' })
      return
    }

    try {
      setIsExporting(true)
      const selectedFunc = funcionarios?.find((f) => f.id === selectedFuncionarioId)
      const monthName = new Date(0, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })

      const data = registros.map((r) => ({
        Data: r.data,
        Funcionário: selectedFunc?.nome,
        Entrada: r.entrada || '-',
        Saída: r.saida || '-',
        Presença: r.presenca ? 'Sim' : 'Não',
        Status: r.status,
        Observação: r.observacao || '-',
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')

      worksheet['!cols'] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
      ]

      const fileName = `Relatorio_${selectedFunc?.nome}_${monthName}_${selectedYear}.xlsx`
      XLSX.writeFile(workbook, fileName)

      setToast({ message: 'Relatório exportado com sucesso!', type: 'success' })
    } catch (error) {
      setToast({ message: 'Erro ao exportar relatório', type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  const calculateStats = () => {
    if (!registros) return null

    const stats = {
      totalPresentes: registros.filter((r) => r.presenca).length,
      totalFaltas: registros.filter((r) => r.status === 'Falta').length,
      totalFolgas: registros.filter((r) => r.status === 'Folga').length,
      totalAtrasos: registros.filter((r) => r.status === 'Atrasado').length,
      horasTrabalhadas: registros
        .filter((r) => r.horasTrabalhadas)
        .reduce((acc, r) => acc + (r.horasTrabalhadas || 0), 0),
    }

    return stats
  }

  const selectedFuncionario = funcionarios?.find((f) => f.id === selectedFuncionarioId)
  const funcionarioOptions =
    funcionarios?.map((f) => ({ value: f.id, label: f.nome })) ?? []
  const selectedFuncionarioOption =
    funcionarioOptions.find((o) => o.value === selectedFuncionarioId) ?? null
  const stats = calculateStats()

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
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Relatórios</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Funcionário *</label>
              <Select
                options={funcionarioOptions}
                value={selectedFuncionarioOption}
                isClearable
                isSearchable
                placeholder="Buscar funcionário..."
                noOptionsMessage={() => 'Nenhum funcionário encontrado'}
                onChange={(option) => setSelectedFuncionarioId(option?.value ?? null)}
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
            <div className="flex items-end">
              <button
                onClick={handleExportExcel}
                disabled={!selectedFuncionarioId || isLoadingRegistros || isExporting}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-slate-400"
              >
                <Download size={20} />
                Exportar Excel
              </button>
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
              description={`Nenhum registro para ${selectedFuncionario.nome}`}
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-slate-600">Dias Presentes</div>
                  <div className="mt-2 text-3xl font-bold text-blue-600">{stats?.totalPresentes}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-slate-600">Faltas</div>
                  <div className="mt-2 text-3xl font-bold text-red-600">{stats?.totalFaltas}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-slate-600">Folgas</div>
                  <div className="mt-2 text-3xl font-bold text-green-600">{stats?.totalFolgas}</div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
