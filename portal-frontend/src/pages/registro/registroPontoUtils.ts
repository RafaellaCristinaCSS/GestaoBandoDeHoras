import { RegistroPonto } from '@/types/api'

export const STATUS_OPTIONS = [
  'Presente',
  'Falta',
  'Folga',
  'Feriado',
  'Atestado Médico',
  'Férias',
] as const

export const formatDateForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const getDefaultPeriod = (reference = new Date()) => ({
  startDate: formatDateForInput(new Date(reference.getFullYear(), reference.getMonth() - 1, 21)),
  endDate: formatDateForInput(new Date(reference.getFullYear(), reference.getMonth(), 20)),
})

export const isToday = (isoDate: string) => {
  const data = parseLocalDate(isoDate)
  const hoje = new Date()

  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  )
}

const toMinutes = (time?: string) => {
  if (!time || time =='00:00') return null

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

export const getHorasTrabalhadas = (registro: RegistroPonto) => {
  const marcacoes = [
    toMinutes(registro.entrada),
    toMinutes(registro.almocInicio),
    toMinutes(registro.almocFim),
    toMinutes(registro.saida),
  ].filter((value): value is number => value != null)

  if (marcacoes.length < 2) return null

  let totalMinutos = 0

  for (let i = 0; i + 1 < marcacoes.length; i += 2) {
    const inicio = marcacoes[i]
    const fim = normalizeRangeMinutes(inicio, marcacoes[i + 1])
    totalMinutos += fim - inicio
  }

  return totalMinutos / 60
}
const excecoesHorasPlanejadas = ['folga', 'feriado', 'falta', 'férias', 'ferias', 'atestado médico']

export const bloqueiaHorarios = (status: string) =>
  status === 'Férias' || status === 'Atestado Médico'

const horariosVazios = {
  entrada: '',
  almocInicio: '',
  almocFim: '',
  saida: '',
} as const

export const getHorasPlanejadas = (registro: RegistroPonto) =>
  excecoesHorasPlanejadas.includes(registro.status.toLowerCase()) ? 0 : registro.horasPrevistas ?? null

export const getSaldoHoras = (registro: RegistroPonto): number | null => {
  const horasTrabalhadas = getHorasTrabalhadas(registro)
  const horasPlanejadas = getHorasPlanejadas(registro)

  if (horasTrabalhadas == null || horasPlanejadas == null) return null

  return horasTrabalhadas - horasPlanejadas
}

export const formatHorasMinutos = (hours: number, options?: { signed?: boolean }) => {
  const totalMinutes = Math.round(Math.abs(hours) * 60)
  const horas = Math.floor(totalMinutes / 60)
  const minutos = totalMinutes % 60
  const horasFormatadas = horas < 100 ? String(horas).padStart(2, '0') : String(horas)
  const formatted = `${horasFormatadas}:${String(minutos).padStart(2, '0')}`

  if (hours === 0) return options?.signed ? '+00:00' : '00:00'
  if (options?.signed) return hours > 0 ? `+${formatted}` : `-${formatted}`

  return hours < 0 ? `-${formatted}` : formatted
}

export const formatSaldoDoDia = (saldo: number | null) => {
  if (saldo == null) return '-'
  if (saldo === 0) return '+00:00'

  return formatHorasMinutos(saldo, { signed: true })
}

export const buildStatusPayload = (status: string): Record<string, string | boolean> => {
  if (status === 'Férias') {
    return {
      folga: false,
      feriado: false,
      atestadoMedico: false,
      ferias: true,
      presenca: false,
      ...horariosVazios,
    }
  }

  if (status === 'Atestado Médico') {
    return {
      folga: false,
      feriado: false,
      atestadoMedico: true,
      ferias: false,
      presenca: false,
      ...horariosVazios,
    }
  }

  if (status === 'Feriado') {
    return {
      folga: false,
      feriado: true,
      atestadoMedico: false,
      ferias: false,
      presenca: false,
      ...horariosVazios,
    }
  }

  if (status === 'Falta') {
    return {
      folga: false,
      feriado: false,
      atestadoMedico: false,
      ferias: false,
      presenca: false,
      ...horariosVazios,
    }
  }

  if (status === 'Folga') {
    return {
      folga: true,
      feriado: false,
      atestadoMedico: false,
      ferias: false,
      presenca: false,
      ...horariosVazios,
    }
  }

  return {
    folga: false,
    feriado: false,
    atestadoMedico: false,
    ferias: false,
    presenca: true,
  }
}
