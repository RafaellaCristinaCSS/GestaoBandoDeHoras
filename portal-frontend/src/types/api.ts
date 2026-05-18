// Funcionário
export interface Funcionario {
  id: number
  nome: string
  cargo: string
  cargaHorariaSemanal: number
  ativo: boolean
  dataCadastro?: string
}

export interface CreateFuncionarioDTO {
  nome: string
  cargo: string
  cargaHorariaSemanal: number
  ativo: boolean
}

export interface UpdateFuncionarioDTO extends Partial<CreateFuncionarioDTO> {}

// Escala
export interface Escala {
  id: number
  funcionarioId: number
  diaSemana: number
  horaInicio: string
  horaFim: string
  horaAlmocoInicio?: string
  horaAlmocoFim?: string
  horasPrevistas: number
  folga: boolean
}

export interface CreateEscalaDTO {
  funcionarioId: number
  diaSemana: number
  horaInicio: string
  horaFim: string
  horaAlmocoInicio?: string
  horaAlmocoFim?: string
  horasPrevistas: number
  folga: boolean
}

// Registro de Ponto
export interface RegistroPonto {
  id: number
  funcionarioId: number
  data: string
  entrada?: string
  almocInicio?: string
  almocFim?: string
  saida?: string
  presenca: boolean
  observacao?: string
  status: string
  horasTrabalhadas?: number
  atraso?: number
}

export interface CreateRegistroPontoDTO {
  funcionarioId: number
  data: string
  entrada?: string
  almocInicio?: string
  almocFim?: string
  saida?: string
  presenca: boolean
  observacao?: string
}

// Férias
export interface Ferias {
  id: number
  funcionarioId: number
  dataInicio: string
  dataFim: string
  observacao?: string
}

export interface CreateFeriasDTO {
  funcionarioId: number
  dataInicio: string
  dataFim: string
  observacao?: string
}

// Relatório
export interface RelatorioResumo {
  funcionarioId: number
  funcionarioNome: string
  mes: number
  ano: number
  totalHorasTrabalhadas: number
  faltas: number
  atrasos: number
  horasExtras: number
  diasPresentes: number
  diasFolga: number
}
