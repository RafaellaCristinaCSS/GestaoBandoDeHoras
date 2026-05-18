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

// Cargo
export interface Cargo {
  id: number
  nome: string
}

export interface CreateCargoDTO {
  nome: string
}

// ─── Escala (template centralizado) ────────────────────────────────────────

export enum TipoEscala {
  Semanal = 0,
  Doze36 = 1,
  Personalizada = 2,
}

export interface EscalaDetalhe {
  id: number
  escalaId: number
  diaSemana: number
  horaInicio: string
  horaFim: string
  horaAlmocoInicio?: string
  horaAlmocoFim?: string
  horasPrevistas: number
  folga: boolean
}

export interface Escala {
  id: number
  nome: string
  descricao?: string
  cargaHorariaSemanal: number
  tipoEscala: TipoEscala
  ativa: boolean
  createdAt: string
  detalhes: EscalaDetalhe[]
}

export interface CreateEscalaDTO {
  nome: string
  descricao?: string
  cargaHorariaSemanal: number
  tipoEscala: TipoEscala
  ativa: boolean
  detalhes: CreateEscalaDetalheDTO[]
}

export interface UpdateEscalaDTO {
  nome?: string
  descricao?: string
  cargaHorariaSemanal?: number
  tipoEscala?: TipoEscala
  ativa?: boolean
}

export interface CreateEscalaDetalheDTO {
  diaSemana: number
  horaInicio: string
  horaFim: string
  horaAlmocoInicio?: string
  horaAlmocoFim?: string
  horasPrevistas: number
  folga: boolean
}

export interface UpdateEscalaDetalheDTO {
  horaInicio?: string
  horaFim?: string
  horaAlmocoInicio?: string
  horaAlmocoFim?: string
  horasPrevistas?: number
  folga?: boolean
}

// ─── FuncionarioEscala (histórico de vínculos) ──────────────────────────────

export interface FuncionarioEscala {
  id: number
  funcionarioId: number
  funcionarioNome?: string
  escalaId: number
  escalaNome?: string
  dataInicio: string
  dataFim?: string
  trabalhaDiaPar?: boolean
  createdByUserId: number
  createdAt: string
}

export interface CreateFuncionarioEscalaDTO {
  funcionarioId: number
  escalaId: number
  dataInicio: string
  trabalhaDiaPar?: boolean
  createdByUserId: number
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
  entradaPlanejada?: string
  saidaPlanejada?: string
  horasPrevistas?: number
  presenca: boolean
  feriado: boolean
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
  feriado?: boolean
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
