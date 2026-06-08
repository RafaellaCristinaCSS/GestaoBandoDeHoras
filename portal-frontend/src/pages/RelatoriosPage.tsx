import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx-js-style'
import { funcionarioService } from '@/services/funcionarioService'
import { registroPontoService } from '@/services/registroPontoService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/contexts/ToastContext'
import { Funcionario, RegistroPonto } from '@/types/api'

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateLabel = (date: string) => parseLocalDate(date).toLocaleDateString('pt-BR')

const getDefaultReportPeriod = (reference = new Date()) => ({
  dataInicio: formatDateForInput(new Date(reference.getFullYear(), reference.getMonth() - 1, 21)),
  dataFim: formatDateForInput(new Date(reference.getFullYear(), reference.getMonth(), 20)),
})

const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toMinutes = (time?: string) => {
  if (!time || time === '00:00') return null

  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

const normalizeRangeMinutes = (start: number, end: number) => {
  debugger
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

const toExcelDuration = (hours: number) => {
  return Number((hours / 24).toFixed(10))
}

const getWorkedHours = (registro: RegistroPonto) => {
  // Coleta todos os timestamps disponíveis em ordem e emparelha de 2 em 2.
  // Assim, registros incompletos (ex.: entrada + almocInicio sem saída) ainda
  // contribuem com as horas que estão registradas — essencial para folgas com
  // marcação parcial que devem contar como hora extra.
  const marcacoes = [
    toMinutes(registro.entrada),
    toMinutes(registro.almocInicio),
    toMinutes(registro.almocFim),
    toMinutes(registro.saida),
  ].filter((value): value is number => value != null)

  if (marcacoes.length < 2) return 0
debugger
  let totalMinutos = 0
  for (let i = 0; i + 1 < marcacoes.length; i += 2) {
    const inicio = marcacoes[i]
    const fim = normalizeRangeMinutes(inicio, marcacoes[i + 1])
    totalMinutos += fim - inicio
  }

  return totalMinutos / 60
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
  const defaultPeriod = getDefaultReportPeriod()
  const [startDate, setStartDate] = useState(defaultPeriod.dataInicio)
  const [endDate, setEndDate] = useState(defaultPeriod.dataFim)
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
  const isDateRangeInvalid = Boolean(startDate && endDate && parseLocalDate(startDate) > parseLocalDate(endDate))

  const { data: funcionarios, isLoading: isLoadingFunc } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const activeFuncionarios = (funcionarios ?? []).filter((funcionario) => funcionario.ativo)

  const { data: reportData, isLoading: isLoadingReport } = useQuery<EmployeeReport[]>({
    queryKey: [
      'relatorio-geral',
      startDate,
      endDate,
      activeFuncionarios.map((funcionario) => funcionario.id).join(','),
    ],
    enabled: activeFuncionarios.length > 0 && Boolean(startDate) && Boolean(endDate) && !isDateRangeInvalid,
    queryFn: async () => {
      const reports = await Promise.all(
        activeFuncionarios.map(async (funcionario) => {
          const registros = await registroPontoService.getAll(funcionario.id, undefined, undefined, startDate, endDate)

          // Faltas: não considerar feriado/atestado sem registro como falta
          const faltas = registros.filter((registro) => registro.status === 'Falta' && !registro.feriado && !registro.atestadoMedico)

          const totals = registros.reduce(
            (acc, registro) => {
              // Jornada prevista de folga, feriado e atestado é sempre 0
              const horasPlanejadasDoDia = (registro.folga || registro.feriado || registro.atestadoMedico) ? 0 : (registro.horasPrevistas ?? 0)
              // Em folga, feriado e atestado, todas as horas registradas são extras
              const horasCumpridasDoDia = getWorkedHours(registro)
              acc.horasPlanejadas += horasPlanejadasDoDia
              acc.horasCumpridas += horasCumpridasDoDia
              return acc
            },
            { horasPlanejadas: 0, horasCumpridas: 0 }
          )

          // Saldo: em feriado/atestado, nunca gera atraso; se houver registro, é extra
          // O saldo global já reflete isso pois horasPlanejadas de feriado/atestado é 0

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

  // Mostra apenas quem está devendo ou sobrando horas (saldo diferente de zero)
  const consolidated =
    reportData?.filter((item) => item.saldoHoras !== 0).map<ConsolidatedBalanceItem>((item) => ({
      funcionario: item.funcionario.nome,
      horasPlanejadas: item.horasPlanejadas,
      horasCumpridas: item.horasCumpridas,
      saldoHoras: item.saldoHoras,
      saldoAbsoluto: Math.abs(item.saldoHoras),
      tipo: item.saldoHoras > 0 ? 'Hora Extra' : 'Atraso',
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
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet([])
      // Definir largura das colunas: A = 60, B-E = 20
      worksheet['!cols'] = [
        { wch: 60 }, // Coluna A (Funcionário)
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
      ]
      let rowIndex = 0
      // Styles
      const borderStyle = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      }
      // Todos os estilos sempre recebem a borda preta
      const titleStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 16 },
        fill: { patternType: 'solid', fgColor: { rgb: '16594d' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderStyle,
      }
      const headerStyle = {
        font: { bold: true, color: { rgb: 'ffffff' } },
        fill: { patternType: 'solid', fgColor: { rgb: '#237767' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderStyle,
      }
      const cellStyle = {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderStyle,
      }
      const atrasoStyle = {
        ...cellStyle,
        font: { bold: true, color: { rgb: 'b91c1c' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'fee2e2' } },
        border: borderStyle,
      }
      const extraStyle = {
        ...cellStyle,
        font: { bold: true, color: { rgb: '166534' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'dcfce7' } },
        border: borderStyle,
      }
      // Helpers
      const appendRow = (values: any[], styles: any[]) => {
        XLSX.utils.sheet_add_aoa(worksheet, [values.map(v => v.value !== undefined ? v.value : v)], { origin: { r: rowIndex, c: 0 } })
        values.forEach((v, i) => {
          const address = XLSX.utils.encode_cell({ r: rowIndex, c: i })
          if (!worksheet[address]) return
          if (v.type) worksheet[address].t = v.type
          if (v.format) worksheet[address].z = v.format
          // Sempre aplica borda preta em todas as células
          const baseStyle = styles && styles[i] ? styles[i] : cellStyle
          worksheet[address].s = { ...baseStyle, border: borderStyle }
        })
        rowIndex++
      }
      const appendMergedTitle = (text: string, style: any) => {
        appendRow([{ value: text }], [style])
        worksheet['!merges'] = worksheet['!merges'] || []
        worksheet['!merges'].push({ s: { r: rowIndex - 1, c: 0 }, e: { r: rowIndex - 1, c: 4 } })
      }
      // Título
      appendMergedTitle(`Relatório de Horas - ${formatDateLabel(startDate)} a ${formatDateLabel(endDate)}`, titleStyle)
      appendRow([{ value: `Gerado em ${new Date().toLocaleString('pt-BR')}` }], [cellStyle])
      appendRow([{ value: '' }], [cellStyle])
      // Fechamento consolidado
      appendMergedTitle('Fechamento consolidado', headerStyle)
      appendRow([
        { value: 'Funcionário' },
        { value: 'Horas Previstas' },
        { value: 'Horas Trabalhadas' },
        { value: 'Resultado' },
        { value: 'Saldo Absoluto' },
      ], [headerStyle, headerStyle, headerStyle, headerStyle, headerStyle])
      consolidated.forEach(item => {
        const saldoStyle = item.tipo === 'Atraso' ? atrasoStyle : item.tipo === 'Hora Extra' ? extraStyle : cellStyle
        appendRow([
          { value: item.funcionario },
          { value: toExcelDuration(item.horasPlanejadas), type: 'n', format: '[hh]:mm' },
          { value: toExcelDuration(item.horasCumpridas), type: 'n', format: '[hh]:mm' },
          { value: item.tipo },
          { value: toExcelDuration(item.saldoAbsoluto), type: 'n', format: '[hh]:mm' },
        ], [cellStyle, cellStyle, cellStyle, cellStyle, saldoStyle])
      })
      appendRow([{ value: '' }], [cellStyle])
      // Faltas
      if (exportSections.faltas) {
        appendMergedTitle('Faltas', headerStyle)
        appendRow([
          { value: 'Funcionário' },
          { value: 'Dia' },
          { value: 'Observação' },
        ], [headerStyle, headerStyle, headerStyle])
        absences.forEach(item => {
          appendRow([
            { value: item.funcionario },
            { value: toExcelDate(item.data), type: 'd', format: 'dd/mm/yyyy' },
            { value: item.observacao },
          ], [cellStyle, cellStyle, cellStyle])
        })
        appendRow([{ value: '' }], [cellStyle])
      }
      // Atrasos
      if (exportSections.atrasos) {
        appendMergedTitle('Atrasos', headerStyle)
        appendRow([
          { value: 'Funcionário' },
          { value: 'Horas Previstas' },
          { value: 'Horas Trabalhadas' },
          { value: 'Resultado' },
          { value: 'Atraso Consolidado' },
        ], [headerStyle, headerStyle, headerStyle, headerStyle, headerStyle])
        delays.forEach(item => {
          appendRow([
            { value: item.funcionario },
            { value: toExcelDuration(item.horasPlanejadas), type: 'n', format: '[hh]:mm' },
            { value: toExcelDuration(item.horasCumpridas), type: 'n', format: '[hh]:mm' },
            { value: item.tipo },
            { value: toExcelDuration(item.saldoAbsoluto), type: 'n', format: '[hh]:mm' },
          ], [cellStyle, cellStyle, cellStyle, cellStyle, atrasoStyle])
        })
        appendRow([{ value: '' }], [cellStyle])
      }
      // Horas extras
      if (exportSections.horasExtras) {
        appendMergedTitle('Horas extras', headerStyle)
        appendRow([
          { value: 'Funcionário' },
          { value: 'Horas Previstas' },
          { value: 'Horas Trabalhadas' },
          { value: 'Resultado' },
          { value: 'Hora Extra Consolidada' },
        ], [headerStyle, headerStyle, headerStyle, headerStyle, headerStyle])
        extras.forEach(item => {
          appendRow([
            { value: item.funcionario },
            { value: toExcelDuration(item.horasPlanejadas), type: 'n', format: '[hh]:mm' },
            { value: toExcelDuration(item.horasCumpridas), type: 'n', format: '[hh]:mm' },
            { value: item.tipo },
            { value: toExcelDuration(item.saldoAbsoluto), type: 'n', format: '[hh]:mm' },
          ], [cellStyle, cellStyle, cellStyle, cellStyle, extraStyle])
        })
        appendRow([{ value: '' }], [cellStyle])
      }
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio')
      const fileName = `Relatorio_Geral_${startDate}_a_${endDate}.xlsx`
      XLSX.writeFile(workbook, fileName)
      showToast('Relatório exportado com sucesso!', 'success')
    } catch (e) {
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
              <label className="mb-2 block text-sm font-medium text-slate-700">Data início *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Data fim *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExportExcel}
                disabled={isLoadingReport || isExporting || monthly.length === 0 || isDateRangeInvalid}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-slate-400"
              >
                <Download size={20} />
                Exportar Excel
              </button>
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
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-red-700">Faltas</div>
              <div className="mt-2 text-3xl font-black text-red-700">{absences.length}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-amber-700">Atraso consolidado</div>
              <div className="mt-2 text-3xl font-black text-amber-700">{formatHours(totalAtrasos)}</div>
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
                  {consolidated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                        Nenhum funcionário com saldo de horas positivo ou negativo no período.
                      </td>
                    </tr>
                  ) : (
                    consolidated.map((item) => (
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
                    ))
                  )}
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
