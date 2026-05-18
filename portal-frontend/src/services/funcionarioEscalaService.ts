import api from './api'
import { FuncionarioEscala, CreateFuncionarioEscalaDTO } from '@/types/api'

export const funcionarioEscalaService = {
  getByFuncionarioId: async (funcionarioId: number): Promise<FuncionarioEscala[]> => {
    const response = await api.get(`/funcionario-escalas/funcionario/${funcionarioId}`)
    return response.data
  },

  getCurrent: async (funcionarioId: number): Promise<FuncionarioEscala | null> => {
    try {
      const response = await api.get(`/funcionario-escalas/funcionario/${funcionarioId}/atual`)
      return response.data
    } catch {
      return null
    }
  },

  assign: async (data: CreateFuncionarioEscalaDTO): Promise<FuncionarioEscala> => {
    const response = await api.post('/funcionario-escalas', data)
    return response.data
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/funcionario-escalas/${id}`)
  },
}
