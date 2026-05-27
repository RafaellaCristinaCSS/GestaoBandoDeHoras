import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/contexts/ToastContext'
import { Funcionario, RegistroPonto } from '@/types/api'

const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toMinutes = (time?: string) => {
  if (!time) return null

  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

const normalizeRangeMinutes = (start: number, end: number) => {
  if (end <= start) {
    return end + 24 * 60
  }

  return end
}

const formatHours = (hours: number) => {
  const totalMinutes = Math.round(Math.abs(hours) * 60)
  const formatted = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
  return hours < 0 ? `-${formatted}` : formatted
}

const toExcelDate = (date: string) => {
  const parsedDate = parseLocalDate(date)
  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0, 0)
}

const toExcelTime = (time?: string) => {
  const minutes = toMinutes(time)
  if (minutes == null) return null

  return minutes / (24 * 60)
}

const toExcelDuration = (hours: number) => Math.abs(hours) / 24

const getWorkedHours = (registro: RegistroPonto) => {
  const entrada = toMinutes(registro.entrada)
  const saida = toMinutes(registro.saida)

  if (entrada == null || saida == null) return 0

  const saidaNormalizada = normalizeRangeMinutes(entrada, saida)
  let total = saidaNormalizada - entrada
  const almocoInicio = toMinutes(registro.almocInicio)
  const almocoFim = toMinutes(registro.almocFim)

  if (almocoInicio != null && almocoFim != null) {
    const almocoInicioNormalizado = almocoInicio < entrada ? almocoInicio + 24 * 60 : almocoInicio
    const almocoFimBase = almocoFim < entrada ? almocoFim + 24 * 60 : almocoFim
    const almocoFimNormalizado = normalizeRangeMinutes(almocoInicioNormalizado, almocoFimBase)

    if (almocoInicioNormalizado >= entrada && almocoFimNormalizado <= saidaNormalizada) {
      total -= almocoFimNormalizado - almocoInicioNormalizado
    }
  }

  return total / 60
}

type EmployeeReport = {
  funcionario: Funcionario
  registros: RegistroPonto[]
  faltas: RegistroPonto[]
  horasPlanejadas: number
  horasCumpridas: number
  saldoHoras: number
}

type ConsolidatedBalanceItem = {
  funcionario: string
  horasPlanejadas: number
  horasCumpridas: number
  saldoHoras: number
  saldoAbsoluto: number
  tipo: 'Atraso' | 'Hora Extra' | 'Exato'
}

type ExportCell = {
  value: string | number | Date
  type?: 's' | 'n' | 'd'
  format?: string
}

type ExportSections = {
  faltas: boolean
  atrasos: boolean
  horasExtras: boolean
}

export function RelatoriosPage() {
  const { showToast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isExporting, setIsExporting] = useState(false)
  const [exportSections, setExportSections] = useState<ExportSections>({
    faltas: true,
    atrasos: true,
    horasExtras: true,
  })
  const [absencesPage, setAbsencesPage] = useState(1)
  const [delaysPage, setDelaysPage] = useState(1)
  const [extrasPage, setExtrasPage] = useState(1)
  const pageSize = 10

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
          const registros = await registroPontoService.getAll(funcionario.id, selectedMonth, selectedYear)

          const faltas = registros.filter((registro) => registro.status === 'Falta')

          const totals = registros.reduce(
            (acc, registro) => {
              const horasPlanejadasDoDia = registro.status === 'Feriado' ? 0 : (registro.horasPrevistas ?? 0)
              const horasCumpridasDoDia = registro.status === 'Feriado'
                ? getWorkedHours(registro)
                : registro.presenca
                  ? getWorkedHours(registro)
                  : 0

              acc.horasPlanejadas += horasPlanejadasDoDia
              acc.horasCumpridas += horasCumpridasDoDia
              return acc
            },
            { horasPlanejadas: 0, horasCumpridas: 0 }
          )

          return {
            funcionario,
            registros,
            faltas,
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
    reportData
      ?.filter((item) => item.saldoHoras < 0)
      .map<ConsolidatedBalanceItem>((item) => ({
        funcionario: item.funcionario.nome,
        horasPlanejadas: item.horasPlanejadas,
        horasCumpridas: item.horasCumpridas,
        saldoHoras: item.saldoHoras,
        saldoAbsoluto: Math.abs(item.saldoHoras),
        tipo: 'Atraso',
      })) ?? []

  const extras =
    reportData
      ?.filter((item) => item.saldoHoras > 0)
      .map<ConsolidatedBalanceItem>((item) => ({
        funcionario: item.funcionario.nome,
        horasPlanejadas: item.horasPlanejadas,
        horasCumpridas: item.horasCumpridas,
        saldoHoras: item.saldoHoras,
        saldoAbsoluto: item.saldoHoras,
        tipo: 'Hora Extra',
      })) ?? []

  const consolidated =
    reportData?.map<ConsolidatedBalanceItem>((item) => ({
      funcionario: item.funcionario.nome,
      horasPlanejadas: item.horasPlanejadas,
      horasCumpridas: item.horasCumpridas,
      saldoHoras: item.saldoHoras,
      saldoAbsoluto: Math.abs(item.saldoHoras),
      tipo: item.saldoHoras > 0 ? 'Hora Extra' : item.saldoHoras < 0 ? 'Atraso' : 'Exato',
    })) ?? []

  const monthly = reportData ?? []

  const absencesTotalPages = Math.max(1, Math.ceil(absences.length / pageSize))
  const delaysTotalPages = Math.max(1, Math.ceil(delays.length / pageSize))
  const extrasTotalPages = Math.max(1, Math.ceil(extras.length / pageSize))

  const safeAbsencesPage = Math.min(absencesPage, absencesTotalPages)
  const safeDelaysPage = Math.min(delaysPage, delaysTotalPages)
  const safeExtrasPage = Math.min(extrasPage, extrasTotalPages)

  const paginatedAbsences = absences.slice((safeAbsencesPage - 1) * pageSize, safeAbsencesPage * pageSize)
  const paginatedDelays = delays.slice((safeDelaysPage - 1) * pageSize, safeDelaysPage * pageSize)
  const paginatedExtras = extras.slice((safeExtrasPage - 1) * pageSize, safeExtrasPage * pageSize)

  const totalHorasExtras = extras.reduce((acc, item) => acc + item.saldoAbsoluto, 0)
  const totalAtrasos = delays.reduce((acc, item) => acc + item.saldoAbsoluto, 0)
  const totalExatos = consolidated.filter((item) => item.tipo === 'Exato').length

  const handleExportExcel = async () => {
    if (monthly.length === 0) {
      showToast('Nenhum dado para exportar', 'error')
      return
    }

    if (!Object.values(exportSections).some(Boolean)) {
      showToast('Selecione ao menos um bloco para exportar.', 'error')
      return
    }

    try {
      setIsExporting(true)
      const monthName = new Date(0, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })
      const workbook = XLSX.utils.book_new()

      const worksheet = XLSX.utils.aoa_to_sheet([])
      const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = []
      worksheet['!merges'] = merges
      const totalColumns = 10
      const menuColor = '0F172A'

      worksheet['!cols'] = [
        { wch: 24 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 42 },
      ]

      const titleStyle: any = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 16 },
        fill: { patternType: 'solid', fgColor: { rgb: menuColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
      }

      const subtitleStyle: any = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        fill: { patternType: 'solid', fgColor: { rgb: menuColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
      }

      const headerStyle: any = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: menuColor } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
      }

      const cellStyle: any = {
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } },
        },
      }

      const positiveStyle: any = {
        ...cellStyle,
        font: { bold: true, color: { rgb: '166534' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } },
      }

      const negativeStyle: any = {
        ...cellStyle,
        font: { bold: true, color: { rgb: '991B1B' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } },
      }

      const neutralStyle: any = {
        ...cellStyle,
        font: { bold: true, color: { rgb: '334155' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
      }

      let rowIndex = 0
      const setRowStyle = (row: number, columnCount: number, style: any) => {
        for (let column = 0; column < columnCount; column += 1) {
          const address = XLSX.utils.encode_cell({ r: row, c: column })
          if (worksheet[address]) {
            worksheet[address].s = style
          }
        }
      }

      const appendRow = (values: ExportCell[], style?: any) => {
        const plainValues = values.map((item) => item.value)
        XLSX.utils.sheet_add_aoa(worksheet, [plainValues], { origin: { r: rowIndex, c: 0 } })

        values.forEach((item, columnIndex) => {
          const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
          if (!worksheet[address]) return

          if (item.type) {
            worksheet[address].t = item.type
          }

          if (item.format) {
            worksheet[address].z = item.format
          }
        })

        if (style) {
          setRowStyle(rowIndex, values.length, style)
        }
        rowIndex += 1
      }

      const appendMergedTitle = (text: string, style: any) => {
        appendRow([{ value: text }], style)
        merges.push({ s: { r: rowIndex - 1, c: 0 }, e: { r: rowIndex - 1, c: totalColumns - 1 } })
      }

      const appendSection = (
        title: string,
        headers: string[],
        rows: ExportCell[][],
        options?: { saldoColumnIndex?: number }
      ) => {
        appendMergedTitle(title, subtitleStyle)
        appendRow(headers.map((header) => ({ value: header })), headerStyle)
        rows.forEach((values) => {
          appendRow(values, cellStyle)
          if (options?.saldoColumnIndex != null) {
            const saldoValue = Number(values[options.saldoColumnIndex].value)
            const saldoStyle = saldoValue > 0 ? positiveStyle : saldoValue < 0 ? negativeStyle : neutralStyle
            const address = XLSX.utils.encode_cell({ r: rowIndex - 1, c: options.saldoColumnIndex })
            if (worksheet[address]) {
              worksheet[address].s = saldoStyle
            }
          }
        })
        rowIndex += 1
      }

      appendMergedTitle(`Relatório de Horas - ${monthName} / ${selectedYear}`, titleStyle)
      appendMergedTitle(`Gerado em ${new Date().toLocaleString('pt-BR')}`, subtitleStyle)
      appendRow([])

      appendSection(
        'Fechamento consolidado',
        ['Funcionário', 'Horas Previstas', 'Horas Trabalhadas', 'Resultado', 'Saldo Absoluto'],
        consolidated.map((item) => [
          { value: item.funcionario },
          { value: toExcelDuration(item.horasPlanejadas), type: 'n', format: '[h]:mm' },
          { value: toExcelDuration(item.horasCumpridas), type: 'n', format: '[h]:mm' },
          { value: item.tipo },
          { value: toExcelDuration(item.saldoAbsoluto), type: 'n', format: '[h]:mm' },
        ])
      )

      if (exportSections.faltas) {
        appendSection(
          'Faltas',
          ['Funcionário', 'Dia', 'Observação'],
          absences.map((item) => [
            { value: item.funcionario },
            { value: toExcelDate(item.data), type: 'd', format: 'dd/mm/yyyy' },
            { value: item.observacao },
          ])
        )
      }

      if (exportSections.atrasos) {
        appendSection(
          'Atrasos',
          [
            'Funcionário',
            'Horas Previstas',
            'Horas Trabalhadas',
            'Resultado',
            'Atraso Consolidado',
          ],
          delays.map((item) => [
            { value: item.funcionario },
            { value: toExcelDuration(item.horasPlanejadas), type: 'n', format: '[h]:mm' },
            { value: toExcelDuration(item.horasCumpridas), type: 'n', format: '[h]:mm' },
            { value: item.tipo },
            { value: toExcelDuration(item.saldoAbsoluto), type: 'n', format: '[h]:mm' },
          ]),
          { saldoColumnIndex: 4 }
        )
      }

      if (exportSections.horasExtras) {
        appendSection(
          'Horas extras',
          [
            'Funcionário',
            'Horas Previstas',
            'Horas Trabalhadas',
            'Resultado',
            'Hora Extra Consolidada',
          ],
          extras.map((item) => [
            { value: item.funcionario },
            { value: toExcelDuration(item.horasPlanejadas), type: 'n', format: '[h]:mm' },
            { value: toExcelDuration(item.horasCumpridas), type: 'n', format: '[h]:mm' },
            { value: item.tipo },
            { value: toExcelDuration(item.saldoAbsoluto), type: 'n', format: '[h]:mm' },
          ]),
          { saldoColumnIndex: 4 }
        )
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio')

      const fileName = `Relatorio_Geral_${monthName}_${selectedYear}.ods`
      XLSX.writeFile(workbook, fileName, { bookType: 'ods' })

      showToast('Relatório exportado com sucesso!', 'success')
    } catch {
      showToast('Erro ao exportar relatório', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoadingFunc) return <Loading />

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPrev: () => void,
    onNext: () => void
  ) => (
    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
      <p className="text-sm text-slate-600">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={onPrev}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={onNext}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Relatórios</h1>
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Personalizar planilha exportada</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={exportSections.faltas}
                  onChange={(e) => setExportSections((prev) => ({ ...prev, faltas: e.target.checked }))}
                />
                Faltas
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={exportSections.atrasos}
                  onChange={(e) => setExportSections((prev) => ({ ...prev, atrasos: e.target.checked }))}
                />
                Atrasos
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={exportSections.horasExtras}
                  onChange={(e) => setExportSections((prev) => ({ ...prev, horasExtras: e.target.checked }))}
                />
                Horas extras
              </label>
            </div>
          </div>
        </div>
      </div>

      {isLoadingReport ? (
        <Loading />
      ) : monthly.length === 0 ? (
        <EmptyState
          title="Nenhum dado para o relatório"
          description="Cadastre funcionários, escalas e registros para visualizar faltas, atrasos e horas extras."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-red-700">Faltas</div>
              <div className="mt-2 text-3xl font-black text-red-700">{absences.length}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-amber-700">Atraso consolidado</div>
              <div className="mt-2 text-3xl font-black text-amber-700">{formatHours(totalAtrasos)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-600">Saldo zerado</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{totalExatos}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-600">Hora extra consolidada</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {formatHours(totalHorasExtras)}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Fechamento consolidado</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas previstas</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas trabalhadas</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Resultado</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Saldo absoluto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {consolidated.map((item) => (
                    <tr key={item.funcionario} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.funcionario}</td>
                      <td className="px-6 py-4 text-slate-700">{formatHours(item.horasPlanejadas)}</td>
                      <td className="px-6 py-4 text-slate-700">{formatHours(item.horasCumpridas)}</td>
                      <td className="px-6 py-4 text-slate-700">{item.tipo}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black shadow-sm ${
                            item.tipo === 'Hora Extra'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.tipo === 'Atraso'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {formatHours(item.saldoAbsoluto)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Faltas</h2>
              </div>
              {absences.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">Nenhuma falta encontrada no período.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Dia</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedAbsences.map((item, index) => (
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
                  {renderPagination(
                    safeAbsencesPage,
                    absencesTotalPages,
                    () => setAbsencesPage((page) => Math.max(1, page - 1)),
                    () => setAbsencesPage((page) => Math.min(absencesTotalPages, page + 1))
                  )}
                </>
              )}
            </section>

            <section className="overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Atrasos</h2>
              </div>
              {delays.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">Nenhum atraso consolidado encontrado no período.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas previstas</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas trabalhadas</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Resultado</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Atraso consolidado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedDelays.map((item, index) => (
                      <tr key={`${item.funcionario}-${index}`} className="hover:bg-amber-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{item.funcionario}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                            {formatHours(item.horasPlanejadas)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                            {formatHours(item.horasCumpridas)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{item.tipo}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-sm">
                            {formatHours(item.saldoAbsoluto)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                  {renderPagination(
                    safeDelaysPage,
                    delaysTotalPages,
                    () => setDelaysPage((page) => Math.max(1, page - 1)),
                    () => setDelaysPage((page) => Math.min(delaysTotalPages, page + 1))
                  )}
                </>
              )}
            </section>

            <section className="overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Horas extras</h2>
              </div>
              {extras.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">Nenhuma hora extra consolidada encontrada no período.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="border-b bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas previstas</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Horas trabalhadas</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Resultado</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Hora extra consolidada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedExtras.map((item, index) => (
                        <tr key={`${item.funcionario}-${index}`} className="hover:bg-amber-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{item.funcionario}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                              {formatHours(item.horasPlanejadas)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                              {formatHours(item.horasCumpridas)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{item.tipo}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                              {formatHours(item.saldoAbsoluto)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(
                    safeExtrasPage,
                    extrasTotalPages,
                    () => setExtrasPage((page) => Math.max(1, page - 1)),
                    () => setExtrasPage((page) => Math.min(extrasTotalPages, page + 1))
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
