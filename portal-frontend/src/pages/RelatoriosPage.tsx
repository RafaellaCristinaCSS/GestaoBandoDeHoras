import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Eye } from 'lucide-react'
import * as XLSX from 'xlsx-js-style'
import { funcionarioService } from '@/services/funcionarioService'
import { feriasService } from '@/services/feriasService'
import { registroPontoService } from '@/services/registroPontoService'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/contexts/ToastContext'
import { Funcionario, RegistroPonto } from '@/types/api'
import {
  formatSaldoDoDia,
  getSaldoHoras,
  parseLocalDate as parseLocalDateFromUtils,
} from '@/pages/registro/registroPontoUtils'

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

const parseLocalDate = parseLocalDateFromUtils

const formatSignedBalanceShort = (saldo: number) => formatSaldoDoDia(saldo)

const toInputDate = (value?: string) => {
  if (!value) return ''
  return value.length >= 10 ? value.slice(0, 10) : value
}

const toMinutes = (time?: string) => {
  if (!time || time === '00:00') return null

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

type DailyOccurrenceItem = {
  data: string
  entrada: string
  almocInicio: string
  almocFim: string
  saida: string
  saldoHoras: number
}

type ConsolidatedBalanceItem = {
  funcionario: string
  horasPlanejadas: number
  horasCumpridas: number
  saldoHoras: number
  saldoAbsoluto: number
  tipo: 'Atraso' | 'Hora Extra' | 'Exato'
  dias: DailyOccurrenceItem[]
}

type ExportSections = {
  faltas: boolean
  atestadosMedicos: boolean
  horaExtraAtraso: boolean
}

type FeriasPeriodItem = {
  dataInicio: string
  dataFim: string
}

type FeriasReportGroup = {
  funcionario: string
  periodos: FeriasPeriodItem[]
}

type MedicalCertificateItem = {
  data: string
  observacao: string
}

type MedicalCertificateGroup = {
  funcionario: string
  itens: MedicalCertificateItem[]
  total: number
}

const formatTimeDisplay = (time?: string) => {
  if (!time || time === '00:00') return '-'
  return time
}

const getDaysWithOccurrence = (registros: RegistroPonto[]): DailyOccurrenceItem[] =>
  registros
    .filter((registro) => {
      const saldo = getSaldoHoras(registro)
      return saldo != null && saldo !== 0
    })
    .sort((a, b) => a.data.localeCompare(b.data, 'pt-BR'))
    .map((registro) => ({
      data: registro.data,
      entrada: formatTimeDisplay(registro.entrada),
      almocInicio: formatTimeDisplay(registro.almocInicio),
      almocFim: formatTimeDisplay(registro.almocFim),
      saida: formatTimeDisplay(registro.saida),
      saldoHoras: getSaldoHoras(registro)!,
    }))

const formatFeriasPeriod = (dataInicio: string, dataFim: string) =>
  `${parseLocalDate(toInputDate(dataInicio)).toLocaleDateString('pt-BR')} até ${parseLocalDate(toInputDate(dataFim)).toLocaleDateString('pt-BR')}`

const periodsIntersect = (inicioA: string, fimA: string, inicioB: string, fimB: string) => {
  const startA = parseLocalDate(toInputDate(inicioA))
  const endA = parseLocalDate(toInputDate(fimA))
  const startB = parseLocalDate(inicioB)
  const endB = parseLocalDate(fimB)

  return startA <= endB && endA >= startB
}

function ExpandEyeButton({
  expanded,
  onClick,
  visible,
}: {
  expanded: boolean
  onClick: () => void
  visible: boolean
}) {
  if (!visible) return null

  return (
    <button
      type="button"
      title={expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      aria-label={expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="mr-2 inline-flex text-blue-600 hover:text-blue-800"
    >
      <Eye size={18} />
    </button>
  )
}

export function RelatoriosPage() {
  const { showToast } = useToast()
  const defaultPeriod = getDefaultReportPeriod()
  const [startDate, setStartDate] = useState(defaultPeriod.dataInicio)
  const [endDate, setEndDate] = useState(defaultPeriod.dataFim)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSections, setExportSections] = useState<ExportSections>({
    faltas: true,
    atestadosMedicos: true,
    horaExtraAtraso: true,
  })
  const [absencesPage, setAbsencesPage] = useState(1)
  const [medicalCertificatesPage, setMedicalCertificatesPage] = useState(1)
  const [expandedMedicalEmployees, setExpandedMedicalEmployees] = useState<Record<string, boolean>>({})
  const [expandedConsolidatedEmployees, setExpandedConsolidatedEmployees] = useState<Record<string, boolean>>({})
  const pageSize = 10
  const isDateRangeInvalid = Boolean(startDate && endDate && parseLocalDate(startDate) > parseLocalDate(endDate))

  const { data: funcionarios, isLoading: isLoadingFunc } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: funcionarioService.getAll,
  })

  const { data: feriasList } = useQuery({
    queryKey: ['ferias'],
    queryFn: feriasService.getAll,
  })

  const activeFuncionarios = (funcionarios ?? []).filter((funcionario) => {
    if (!startDate || !endDate) return false

    const dataAdmissao = parseLocalDate(toInputDate(funcionario.dataAdmissao))
    const dataDemissao = funcionario.dataDemissao ? parseLocalDate(toInputDate(funcionario.dataDemissao)) : null
    const inicioPeriodo = parseLocalDate(startDate)
    const fimPeriodo = parseLocalDate(endDate)

    // Considera no relatório apenas quem teve vínculo ativo em algum dia do período.
    // A partir da data de demissão (inclusive), o funcionário deixa de ser considerado.
    return dataAdmissao <= fimPeriodo && (!dataDemissao || dataDemissao > inicioPeriodo)
  })

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
          const dataAdmissao = parseLocalDate(toInputDate(funcionario.dataAdmissao))
          const dataDemissao = funcionario.dataDemissao ? parseLocalDate(toInputDate(funcionario.dataDemissao)) : null
          const registrosNoVinculo = registros.filter((registro) => {
            const dataRegistro = parseLocalDate(registro.data)
            if (dataRegistro < dataAdmissao) return false
            if (dataDemissao && dataRegistro >= dataDemissao) return false
            return true
          })

          // Faltas: não considerar feriado/atestado sem registro como falta
          const faltas = registrosNoVinculo.filter((registro) => registro.status === 'Falta' && !registro.feriado && !registro.atestadoMedico)

          const totals = registrosNoVinculo.reduce(
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
            registros: registrosNoVinculo,
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

  const medicalCertificates =
    reportData?.flatMap((item) =>
      item.registros
        .filter((registro) => registro.atestadoMedico)
        .map((registro) => ({
          funcionario: item.funcionario.nome,
          data: registro.data,
          observacao: registro.observacao || '-',
        }))
    ) ?? []

  const medicalCertificatesByEmployee: MedicalCertificateGroup[] = Object.values(
    medicalCertificates.reduce<Record<string, { funcionario: string; itens: MedicalCertificateItem[] }>>((acc, item) => {
      if (!acc[item.funcionario]) {
        acc[item.funcionario] = {
          funcionario: item.funcionario,
          itens: [],
        }
      }

      acc[item.funcionario].itens.push({
        data: item.data,
        observacao: item.observacao,
      })

      return acc
    }, {})
  )
    .map((group) => ({
      ...group,
      itens: [...group.itens].sort((a, b) => a.data.localeCompare(b.data, 'pt-BR')),
      total: group.itens.length,
    }))
    .sort((a, b) => a.funcionario.localeCompare(b.funcionario, 'pt-BR'))

  const consolidated =
    reportData?.filter((item) => item.saldoHoras !== 0).map<ConsolidatedBalanceItem>((item) => ({
      funcionario: item.funcionario.nome,
      horasPlanejadas: item.horasPlanejadas,
      horasCumpridas: item.horasCumpridas,
      saldoHoras: item.saldoHoras,
      saldoAbsoluto: Math.abs(item.saldoHoras),
      tipo: item.saldoHoras > 0 ? 'Hora Extra' : 'Atraso',
      dias: getDaysWithOccurrence(item.registros),
    })) ?? []

  const feriasInPeriod: FeriasReportGroup[] = (() => {
    if (!feriasList || !startDate || !endDate || isDateRangeInvalid) return []

    const intersecting = feriasList.filter((feria) =>
      periodsIntersect(feria.dataInicio, feria.dataFim, startDate, endDate)
    )

    const grouped = intersecting.reduce<Record<string, FeriasReportGroup>>((acc, feria) => {
      const nome =
        feria.funcionarioName ??
        funcionarios?.find((funcionario) => funcionario.id === feria.funcionarioId)?.nome ??
        `Funcionário #${feria.funcionarioId}`

      if (!acc[nome]) {
        acc[nome] = { funcionario: nome, periodos: [] }
      }

      acc[nome].periodos.push({
        dataInicio: feria.dataInicio,
        dataFim: feria.dataFim,
      })

      return acc
    }, {})

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        periodos: [...group.periodos].sort((a, b) => a.dataInicio.localeCompare(b.dataInicio, 'pt-BR')),
      }))
      .sort((a, b) => a.funcionario.localeCompare(b.funcionario, 'pt-BR'))
  })()

  const monthly = reportData ?? []

  const absencesTotalPages = Math.max(1, Math.ceil(absences.length / pageSize))
  const medicalCertificatesTotalPages = Math.max(1, Math.ceil(medicalCertificatesByEmployee.length / pageSize))

  const safeAbsencesPage = Math.min(absencesPage, absencesTotalPages)
  const safeMedicalCertificatesPage = Math.min(medicalCertificatesPage, medicalCertificatesTotalPages)

  const paginatedAbsences = absences.slice((safeAbsencesPage - 1) * pageSize, safeAbsencesPage * pageSize)
  const paginatedMedicalCertificatesByEmployee = medicalCertificatesByEmployee.slice((safeMedicalCertificatesPage - 1) * pageSize, safeMedicalCertificatesPage * pageSize)

  const totalHorasExtras = consolidated
    .filter((item) => item.saldoHoras > 0)
    .reduce((acc, item) => acc + item.saldoAbsoluto, 0)
  const totalAtrasos = consolidated
    .filter((item) => item.saldoHoras < 0)
    .reduce((acc, item) => acc + item.saldoAbsoluto, 0)

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
      // Definir largura das colunas
      worksheet['!cols'] = [
        { wch: 60 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
      ]
      let rowIndex = 0
      // Styles
      const borderStyle = {
        top: { style: 'thin', color: { rgb: '595959' } },
        bottom: { style: 'thin', color: { rgb: '595959' } },
        left: { style: 'thin', color: { rgb: '888888' } },
        right: { style: 'thin', color: { rgb: '888888' } },
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
        fill: { patternType: 'solid', fgColor: { rgb: '16594d' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderStyle,
      }
      const headerSecondaryStyle = {
        font: { bold: true, color: { rgb: '16594d' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'ebf1de' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderStyle,
      }
      const headerTertiaryStyle = {
        font: { bold: true, color: { rgb: '16594d' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'ffffff' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderStyle,
      }
      const cellStyle = {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderStyle,
      }
      const cellStyleNoBorder = {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {}
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
      const appendMergedTitle = (text: string, style: any, lastColumnIndex = 5) => {
        appendRow([{ value: text }], [style])

        worksheet['!merges'] = worksheet['!merges'] || []
        worksheet['!merges'].push({ s: { r: rowIndex - 1, c: 0 }, e: { r: rowIndex - 1, c: lastColumnIndex } })
      }
      // Título
      appendMergedTitle(
        `Relatório de Horas - ${formatDateLabel(startDate)} a ${formatDateLabel(endDate)}`,
        titleStyle
      )

      // Aumenta a altura da primeira linha (título)
      worksheet['!rows'] = worksheet['!rows'] || []
      worksheet['!rows'][0] = { hpt: 35 }

      // Segunda linha
      appendRow([
        { value: `Gerado em ${new Date().toLocaleString('pt-BR')}` }
      ], [cellStyle])

      // Faz a segunda linha ocupar todas as colunas (A:E)
      worksheet['!merges'] = worksheet['!merges'] || []
      worksheet['!merges'].push({
        s: { r: 1, c: 0 },
        e: { r: 1, c: 5 }
      })

      // Opcional: aumenta a altura da segunda linha também
      worksheet['!rows'][1] = { hpt: 25 }
      // Faltas
      if (exportSections.faltas && absences.length > 0) {
        appendMergedTitle('Faltas', headerStyle, 4)

        worksheet['!merges'] = worksheet['!merges'] || []

        appendRow([
          { value: 'Funcionário' },
          { value: 'Dia' },
          { value: 'Observação' },
          { value: '' },
          { value: '' },
        ], [
          headerSecondaryStyle,
          headerSecondaryStyle,
          headerSecondaryStyle,
          headerSecondaryStyle,
          headerSecondaryStyle,
        ])

        const headerRow = rowIndex - 1

        worksheet['!merges']!.push({
          s: { r: headerRow, c: 2 }, // C
          e: { r: headerRow, c: 4 }, // E
        })

        absences.forEach(item => {
          appendRow([
            { value: item.funcionario },
            { value: parseLocalDate(item.data).toLocaleDateString('pt-BR') },
            { value: item.observacao },
            { value: '' },
            { value: '' },
          ], [
            cellStyle,
            cellStyle,
            cellStyle,
            cellStyle,
            cellStyle,
          ])

          const absenceRow = rowIndex - 1

          worksheet['!merges']!.push({
            s: { r: absenceRow, c: 2 }, // C
            e: { r: absenceRow, c: 4 }, // E
          })
        })
      }
      // Atestados médicos
      if (exportSections.atestadosMedicos && medicalCertificatesByEmployee.length > 0) {
        appendMergedTitle('Atestados médicos', headerStyle)

        worksheet['!merges'] = worksheet['!merges'] || []

        medicalCertificatesByEmployee.forEach(group => {

          // Funcionário + quantidade
          appendRow([
            { value: group.funcionario },
            { value: '' },
            { value: '' },
            { value: '' },
            { value: "Quantidade:" + group.total }
          ], [
            headerSecondaryStyle,
            headerSecondaryStyle,
            headerSecondaryStyle,
            headerSecondaryStyle,
            headerSecondaryStyle
          ])

          const funcionarioRow = rowIndex - 1

          worksheet['!merges']!.push({
            s: { r: funcionarioRow, c: 0 },
            e: { r: funcionarioRow, c: 3 }
          })

          // Cabeçalho dos detalhes
          appendRow([
            { value: 'Data' },
            { value: 'Observação' },
            { value: '' },
            { value: '' },
            { value: '' }
          ], [
            headerTertiaryStyle,
            headerTertiaryStyle,
            headerTertiaryStyle,
            headerTertiaryStyle,
            headerTertiaryStyle
          ])

          const cabecalhoRow = rowIndex - 1

          worksheet['!merges']!.push({
            s: { r: cabecalhoRow, c: 1 },
            e: { r: cabecalhoRow, c: 4 }
          })

          // Datas e observações
          const itens = group.itens ?? []

          itens.forEach(item => {

            appendRow([
              { value: parseLocalDate(item.data).toLocaleDateString('pt-BR') },
              { value: item.observacao || '' },
              { value: '' },
              { value: '' },
              { value: '' }
            ], [
              cellStyle,
              cellStyle,
              cellStyle,
              cellStyle,
              cellStyle
            ])

            const detalheRow = rowIndex - 1

            worksheet['!merges']!.push({
              s: { r: detalheRow, c: 1 },
              e: { r: detalheRow, c: 4 }
            })
          })
        })
      }
      // Fechamento consolidado
      appendMergedTitle('Fechamento consolidado', headerStyle)
      appendRow([
        { value: 'Funcionário' },
        { value: 'Horas Previstas' },
        { value: 'Horas Trabalhadas' },
        { value: 'Resultado' },
        { value: 'Saldo Absoluto' },
      ], [headerSecondaryStyle, headerSecondaryStyle, headerSecondaryStyle, headerSecondaryStyle, headerSecondaryStyle])
      consolidated.forEach(item => {
        const saldoStyle = item.tipo === 'Atraso' ? atrasoStyle : item.tipo === 'Hora Extra' ? extraStyle : cellStyle
        appendRow([
          { value: item.funcionario },
          { value: toExcelDuration(item.horasPlanejadas), type: 'n', format: '[hh]:mm' },
          { value: toExcelDuration(item.horasCumpridas), type: 'n', format: '[hh]:mm' },
          { value: item.tipo },
          { value: toExcelDuration(item.saldoAbsoluto), type: 'n', format: '[hh]:mm' },
          { value: '' },
        ], [cellStyle, cellStyle, cellStyle, cellStyle, saldoStyle, cellStyle])
      })

      if (feriasInPeriod.length > 0) {
        appendMergedTitle('Férias', headerStyle)

        appendRow([
          { value: 'Funcionário' },
          { value: 'Período de férias' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
        ], [
          headerSecondaryStyle,
          headerSecondaryStyle,
          headerSecondaryStyle,
          headerSecondaryStyle,
          headerSecondaryStyle,
          headerSecondaryStyle,
        ])

        const feriasHeaderRow = rowIndex - 1

        worksheet['!merges'] = worksheet['!merges'] || []
        worksheet['!merges']!.push({
          s: { r: feriasHeaderRow, c: 1 },
          e: { r: feriasHeaderRow, c: 5 },
        })

        feriasInPeriod.forEach((group) => {
          group.periodos.forEach((periodo) => {
            appendRow([
              { value: group.funcionario },
              { value: formatFeriasPeriod(periodo.dataInicio, periodo.dataFim) },
              { value: '' },
              { value: '' },
              { value: '' },
              { value: '' },
            ], [cellStyle, cellStyle, cellStyle, cellStyle, cellStyle, cellStyle])

            const feriasRow = rowIndex - 1

            worksheet['!merges']!.push({
              s: { r: feriasRow, c: 1 },
              e: { r: feriasRow, c: 5 },
            })
          })
        })
      }

      if (exportSections.horaExtraAtraso) {
        const consolidatedComDetalhes = consolidated.filter((item) => item.dias.length > 0)

        if (consolidatedComDetalhes.length > 0) {
          appendMergedTitle('Detalhamento Hora Extra / Atraso', headerStyle)

          consolidatedComDetalhes.forEach((item) => {
            appendRow([
              { value: `${item.funcionario} : ${formatSignedBalanceShort(item.saldoHoras)}` },
              { value: '' },
              { value: '' },
              { value: '' },
              { value: '' },
              { value: '' },
            ], [
              headerSecondaryStyle,
              headerSecondaryStyle,
              headerSecondaryStyle,
              headerSecondaryStyle,
              headerSecondaryStyle,
              headerSecondaryStyle,
            ])

            const funcionarioRow = rowIndex - 1

            worksheet['!merges'] = worksheet['!merges'] || []
            worksheet['!merges']!.push({
              s: { r: funcionarioRow, c: 0 },
              e: { r: funcionarioRow, c: 5 },
            })

            appendRow([
              { value: 'Data' },
              { value: 'Entrada' },
              { value: 'Saída Almoço' },
              { value: 'Volta Almoço' },
              { value: 'Saída' },
              { value: 'Saldo do Dia' },
            ], [
              headerTertiaryStyle,
              headerTertiaryStyle,
              headerTertiaryStyle,
              headerTertiaryStyle,
              headerTertiaryStyle,
              headerTertiaryStyle,
            ])

            item.dias.forEach((dia) => {
              const saldoStyleDia =
                dia.saldoHoras < 0 ? atrasoStyle : dia.saldoHoras > 0 ? extraStyle : cellStyle

              appendRow([
                { value: parseLocalDate(dia.data).toLocaleDateString('pt-BR') },
                { value: dia.entrada },
                { value: dia.almocInicio },
                { value: dia.almocFim },
                { value: dia.saida },
                { value: formatSaldoDoDia(dia.saldoHoras) },
              ], [cellStyle, cellStyle, cellStyle, cellStyle, cellStyle, saldoStyleDia])
            })
          })
        }
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
            <p className="mb-3 text-sm font-semibold text-slate-700">Personalizar relatório e planilha exportada</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                  checked={exportSections.atestadosMedicos}
                  onChange={(e) => setExportSections((prev) => ({ ...prev, atestadosMedicos: e.target.checked }))}
                />
                Atestados médicos
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={exportSections.horaExtraAtraso}
                  onChange={(e) => setExportSections((prev) => ({ ...prev, horaExtraAtraso: e.target.checked }))}
                />
                Hora Extra / Atraso
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
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-red-700">Faltas</div>
              <div className="mt-2 text-3xl font-black text-red-700">{absences.length}</div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-blue-700">Atestados médicos</div>
              <div className="mt-2 text-3xl font-black text-blue-700">{medicalCertificates.length}</div>
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
                    consolidated.map((item) => {
                      const isExpanded = Boolean(expandedConsolidatedEmployees[item.funcionario])
                      const canExpand = exportSections.horaExtraAtraso && item.dias.length > 0

                      return (
                        <Fragment key={item.funcionario}>
                          <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-700">
                              <div className="flex items-center">
                                <ExpandEyeButton
                                  expanded={isExpanded}
                                  visible={canExpand}
                                  onClick={() =>
                                    setExpandedConsolidatedEmployees((prev) => ({
                                      ...prev,
                                      [item.funcionario]: !prev[item.funcionario],
                                    }))
                                  }
                                />
                                <span>
                                  {item.funcionario}
                                  {canExpand && (
                                    <span className="ml-2 font-semibold text-slate-900">
                                      {formatSignedBalanceShort(item.saldoHoras)}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-700">{formatHours(item.horasPlanejadas)}</td>
                            <td className="px-6 py-4 text-slate-700">{formatHours(item.horasCumpridas)}</td>
                            <td className="px-6 py-4 text-slate-700">{item.tipo}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black shadow-sm ${item.tipo === 'Hora Extra'
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
                          {canExpand && isExpanded && (
                            <tr className="bg-slate-50/60">
                              <td colSpan={5} className="px-6 py-4">
                                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                  <table className="w-full text-sm">
                                    <thead className="border-b bg-slate-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-900">Data</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-900">Entrada</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-900">Saída Almoço</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-900">Volta Almoço</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-900">Saída</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-900">Saldo do Dia</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {item.dias.map((dia) => (
                                        <tr key={`${item.funcionario}-${dia.data}`}>
                                          <td className="px-4 py-2 text-slate-700">
                                            {parseLocalDate(dia.data).toLocaleDateString('pt-BR')}
                                          </td>
                                          <td className="px-4 py-2 text-slate-700">{dia.entrada}</td>
                                          <td className="px-4 py-2 text-slate-700">{dia.almocInicio}</td>
                                          <td className="px-4 py-2 text-slate-700">{dia.almocFim}</td>
                                          <td className="px-4 py-2 text-slate-700">{dia.saida}</td>
                                          <td className="px-4 py-2">
                                            <span
                                              className={`font-semibold ${dia.saldoHoras < 0
                                                ? 'text-red-700'
                                                : dia.saldoHoras > 0
                                                  ? 'text-green-700'
                                                  : 'text-slate-700'
                                                }`}
                                            >
                                              {formatSaldoDoDia(dia.saldoHoras)}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </section>

            {feriasInPeriod.length > 0 && (
              <section className="overflow-hidden rounded-xl bg-white shadow">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-xl font-bold text-slate-900">Férias</h2>
                </div>
                <div className="divide-y">
                  {feriasInPeriod.map((group) => (
                    <div key={group.funcionario} className="px-6 py-4">
                      <div className="text-base font-semibold text-slate-900">{group.funcionario}</div>
                      {group.periodos.map((periodo, index) => (
                        <p key={`${group.funcionario}-${periodo.dataInicio}-${index}`} className="mt-2 text-sm text-slate-700">
                          Período de férias:{' '}
                          <span className="font-semibold text-slate-900">
                            {formatFeriasPeriod(periodo.dataInicio, periodo.dataFim)}
                          </span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                          <td className="px-6 py-4 text-slate-700">{item.funcionario}</td>
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
                <h2 className="text-xl font-bold text-slate-900">Atestados médicos</h2>
              </div>
              {medicalCertificates.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">Nenhum atestado médico encontrado no período.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="border-b bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Funcionário</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Qtd. de atestados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedMedicalCertificatesByEmployee.map((group) => {
                        const isExpanded = Boolean(expandedMedicalEmployees[group.funcionario])

                        return (
                          <Fragment key={group.funcionario}>
                            <tr className="hover:bg-blue-50">
                              <td className="px-6 py-4 text-slate-700">
                                <div className="flex items-center">
                                  <ExpandEyeButton
                                    expanded={isExpanded}
                                    visible
                                    onClick={() =>
                                      setExpandedMedicalEmployees((prev) => ({
                                        ...prev,
                                        [group.funcionario]: !prev[group.funcionario],
                                      }))
                                    }
                                  />
                                  {group.funcionario}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-700">{group.total}</td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-blue-50/40">
                                <td colSpan={2} className="px-6 py-4">
                                  <div className="space-y-2">
                                    {(group.itens ?? []).map((item, index) => (
                                      <div key={`${group.funcionario}-${item.data}-${index}`} className="rounded-lg border border-blue-100 bg-white px-4 py-3">
                                        <div className="text-sm font-semibold text-slate-900">
                                          {parseLocalDate(item.data).toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="text-sm text-slate-700">Observação: {item.observacao}</div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                  {renderPagination(
                    safeMedicalCertificatesPage,
                    medicalCertificatesTotalPages,
                    () => setMedicalCertificatesPage((page) => Math.max(1, page - 1)),
                    () => setMedicalCertificatesPage((page) => Math.min(medicalCertificatesTotalPages, page + 1))
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
