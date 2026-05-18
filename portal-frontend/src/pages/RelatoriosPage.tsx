import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { escalaService } from '@/services/escalaService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { Toast } from '@/components/Toast'
import { Escala, Funcionario, RegistroPonto } from '@/types/api'

const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getDiaSemanaEscala = (date: Date) => (date.getDay() + 6) % 7

const toMinutes = (time?: string) => {
  if (!time) return null

  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

const formatMinutes = (minutes: number) => {
  const absoluteMinutes = Math.round(Math.abs(minutes))
  const hours = Math.floor(absoluteMinutes / 60)
  const remainingMinutes = absoluteMinutes % 60
  return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`
}

const formatHours = (hours: number) => `${hours.toFixed(1)}h`

const getWorkedHours = (registro: RegistroPonto) => {
  const entrada = toMinutes(registro.entrada)
  const saida = toMinutes(registro.saida)

  if (entrada == null || saida == null || saida <= entrada) return 0

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

const findEscalaDoDia = (escalas: Escala[], dataIso: string) => {
  const diaSemana = getDiaSemanaEscala(parseLocalDate(dataIso))
  return escalas.find((escala) => escala.diaSemana === diaSemana && !escala.folga)
}

type EmployeeReport = {
  funcionario: Funcionario
  registros: RegistroPonto[]
  escalas: Escala[]
  faltas: RegistroPonto[]
  atrasos: Array<{
    registro: RegistroPonto
    horasPlanejadasDia: number
    horasCumpridasDia: number
    saldoHorasDia: number
    entradaPlanejada?: string
    saidaPlanejada?: string
  }>
  horasPlanejadas: number
  horasCumpridas: number
  saldoHoras: number
}

export function RelatoriosPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data: funcionarios, isLoading: isLoadingFunc } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const activeFuncionarios = (funcionarios ?? []).filter((funcionario) => funcionario.ativo)

  const { data: reportData, isLoading: isLoadingReport } = useQuery<EmployeeReport[]>({
    queryKey: [
      'relatorio-geral',
      selectedMonth,
      selectedYear,
      activeFuncionarios.map((funcionario) => funcionario.id).join(','),
    ],
    enabled: activeFuncionarios.length > 0,
    queryFn: async () => {
      const reports = await Promise.all(
        activeFuncionarios.map(async (funcionario) => {
          const [registros, escalas] = await Promise.all([
            registroPontoService.getAll(funcionario.id, selectedMonth, selectedYear),
            escalaService.getByFuncionarioId(funcionario.id),
          ])

          const faltas = registros.filter((registro) => !registro.presenca || registro.status === 'Falta')

          const atrasos = registros
            .map((registro) => {
              const escalaDoDia = findEscalaDoDia(escalas, registro.data)
              if (!escalaDoDia) return null

              if (!registro.presenca) return null

              const horasPlanejadasDia = escalaDoDia.horasPrevistas
              const horasCumpridasDia = getWorkedHours(registro)
              const saldoHorasDia = horasCumpridasDia - horasPlanejadasDia

              if (saldoHorasDia >= 0) {
                return null
              }

              return {
                registro,
                horasPlanejadasDia,
                horasCumpridasDia,
                saldoHorasDia,
                entradaPlanejada: escalaDoDia.horaInicio,
                saidaPlanejada: escalaDoDia.horaFim,
              }
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)

          const totals = registros.reduce(
            (acc, registro) => {
              const escalaDoDia = findEscalaDoDia(escalas, registro.data)
              const horasPlanejadasDoDia = escalaDoDia?.horasPrevistas ?? 0
              const horasCumpridasDoDia = registro.presenca ? getWorkedHours(registro) : 0

              acc.horasPlanejadas += horasPlanejadasDoDia
              acc.horasCumpridas += horasCumpridasDoDia
              return acc
            },
            { horasPlanejadas: 0, horasCumpridas: 0 }
          )

          return {
            funcionario,
            registros,
            escalas,
            faltas,
            atrasos,
            horasPlanejadas: totals.horasPlanejadas,
            horasCumpridas: totals.horasCumpridas,
            saldoHoras: totals.horasCumpridas - totals.horasPlanejadas,
          }
        })
      )

      return reports.sort((a, b) => a.funcionario.nome.localeCompare(b.funcionario.nome, 'pt-BR'))
    },
  })

  const absences =
    reportData?.flatMap((item) =>
      item.faltas.map((registro) => ({
        funcionario: item.funcionario.nome,
        data: registro.data,
        observacao: registro.observacao || '-',
      }))
    ) ?? []

  const delays =
    reportData?.flatMap((item) =>
      item.atrasos.map((atraso) => ({
        funcionario: item.funcionario.nome,
        data: atraso.registro.data,
        entradaPlanejada: atraso.entradaPlanejada || '-',
        entradaReal: atraso.registro.entrada || '-',
        saidaPlanejada: atraso.saidaPlanejada || '-',
        saidaReal: atraso.registro.saida || '-',
        horasPlanejadasDia: atraso.horasPlanejadasDia,
        horasCumpridasDia: atraso.horasCumpridasDia,
        saldoHorasDia: atraso.saldoHorasDia,
        observacao: atraso.registro.observacao || '-',
      }))
    ) ?? []

  const monthly = reportData ?? []

  const handleExportExcel = async () => {
    if (monthly.length === 0) {
      setToast({ message: 'Nenhum dado para exportar', type: 'error' })
      return
    }

    try {
      setIsExporting(true)
      const monthName = new Date(0, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })

      const faltasSheet = absences.map((item) => ({
        Funcionário: item.funcionario,
        Data: item.data,
        Observação: item.observacao,
      }))

      const atrasosSheet = delays.map((item) => ({
        Funcionário: item.funcionario,
        Data: item.data,
        'Entrada Planejada': item.entradaPlanejada,
        'Entrada Real': item.entradaReal,
        'Saída Planejada': item.saidaPlanejada,
        'Saída Real': item.saidaReal,
        'Horas planejadas': item.horasPlanejadasDia,
        'Horas cumpridas': item.horasCumpridasDia,
        Saldo: item.saldoHorasDia,
        Observação: item.observacao,
      }))

      const mensalSheet = monthly.map((item) => ({
        Funcionário: item.funcionario.nome,
        'Horas planejadas': item.horasPlanejadas,
        'Horas cumpridas': item.horasCumpridas,
        Saldo: item.saldoHoras,
        Faltas: item.faltas.length,
        Atrasos: item.atrasos.length,
      }))

      const workbook = XLSX.utils.book_new()

      const faltasWorksheet = XLSX.utils.json_to_sheet(faltasSheet)
      faltasWorksheet['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 40 }]
      XLSX.utils.book_append_sheet(workbook, faltasWorksheet, 'Faltas')

      const atrasosWorksheet = XLSX.utils.json_to_sheet(atrasosSheet)
      atrasosWorksheet['!cols'] = [
        { wch: 24 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
        { wch: 40 },
      ]
      XLSX.utils.book_append_sheet(workbook, atrasosWorksheet, 'Atrasos')

      const mensalWorksheet = XLSX.utils.json_to_sheet(mensalSheet)
      mensalWorksheet['!cols'] = [
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
      ]
      XLSX.utils.book_append_sheet(workbook, mensalWorksheet, 'Mensal')

      const fileName = `Relatorio_Geral_${monthName}_${selectedYear}.ods`
      XLSX.writeFile(workbook, fileName, { bookType: 'ods' })

      setToast({ message: 'Relatório exportado com sucesso!', type: 'success' })
    } catch {
      setToast({ message: 'Erro ao exportar relatório', type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoadingFunc) return <Loading />

  return (
    <div>
      {toast && (
        <div className="mb-4">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="mb-6">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Relatórios</h1>
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mês *</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                {[...Array(12)].map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {new Date(0, index).toLocaleString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Ano *</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                {[...Array(3)].map((_, index) => {
                  const year = new Date().getFullYear() - 1 + index
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
                disabled={isLoadingReport || isExporting || monthly.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-slate-400"
              >
                <Download size={20} />
                Exportar Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoadingReport ? (
        <Loading />
      ) : monthly.length === 0 ? (
        <EmptyState
          title="Nenhum dado para o relatório"
          description="Cadastre funcionários, escalas e registros para visualizar faltas, atrasos e horas mensais."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-red-700">Faltas</div>
              <div className="mt-2 text-3xl font-black text-red-700">{absences.length}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-amber-700">Atrasos</div>
              <div className="mt-2 text-3xl font-black text-amber-700">{delays.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-600">Funcionários ativos</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{monthly.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-600">Horas planejadas</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {formatHours(monthly.reduce((acc, item) => acc + item.horasPlanejadas, 0))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Faltas</h2>
              </div>
              {absences.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">Nenhuma falta encontrada no período.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Dia</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {absences.map((item, index) => (
                      <tr key={`${item.funcionario}-${item.data}-${index}`} className="hover:bg-red-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{item.funcionario}</td>
                        <td className="px-6 py-4 text-slate-700">
                          {parseLocalDate(item.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{item.observacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Atrasos</h2>
              </div>
              {delays.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">Nenhum atraso encontrado no período.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Dia</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Entrada planejada</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Entrada real</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Saída planejada</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Saída real</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas planejadas</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas cumpridas</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Saldo</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {delays.map((item, index) => (
                      <tr key={`${item.funcionario}-${item.data}-${index}`} className="hover:bg-amber-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{item.funcionario}</td>
                        <td className="px-6 py-4 text-slate-700">
                          {parseLocalDate(item.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{item.entradaPlanejada}</td>
                        <td className="px-6 py-4 text-slate-700">{item.entradaReal}</td>
                        <td className="px-6 py-4 text-slate-700">{item.saidaPlanejada}</td>
                        <td className="px-6 py-4 text-slate-700">{item.saidaReal}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                            {formatHours(item.horasPlanejadasDia)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                            {formatHours(item.horasCumpridasDia)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-sm">
                            {formatHours(item.saldoHorasDia)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{item.observacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Horas mensais</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas planejadas</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas cumpridas</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Saldo</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Faltas</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Atrasos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthly.map((item) => {
                    const saldoClass =
                      item.saldoHoras < 0
                        ? 'bg-red-600 text-white'
                        : item.saldoHoras > 0
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-emerald-100 text-emerald-800'

                    return (
                      <tr key={item.funcionario.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{item.funcionario.nome}</td>
                        <td className="px-6 py-4 text-slate-700">{formatHours(item.horasPlanejadas)}</td>
                        <td className="px-6 py-4 text-slate-700">{formatHours(item.horasCumpridas)}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-black shadow-sm ${saldoClass}`}>
                            {item.saldoHoras >= 0 ? '+' : ''}{formatHours(item.saldoHoras)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{item.faltas.length}</td>
                        <td className="px-6 py-4 text-slate-700">{item.atrasos.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
