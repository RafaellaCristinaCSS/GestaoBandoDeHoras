import api from './api'
import {
  ConfirmarAlteracaoEscalaDTO,
  ConfirmarAlteracaoEscalaResult,
  SimularAlteracaoEscalaDTO,
  SimulacaoAlteracaoEscalaResult,
} from '@/types/api'

export const alteracaoEscalaService = {
  simular: async (data: SimularAlteracaoEscalaDTO): Promise<SimulacaoAlteracaoEscalaResult> => {
    const response = await api.post('/alteracao-escala/simular', data)
    return response.data
  },

  confirmar: async (data: ConfirmarAlteracaoEscalaDTO): Promise<ConfirmarAlteracaoEscalaResult> => {
    const response = await api.post('/alteracao-escala/confirmar', data)
    return response.data
  },
}
