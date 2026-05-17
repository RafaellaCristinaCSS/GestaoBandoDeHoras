import api from './api'
import { Escala, CreateEscalaDTO } from '@/types/api'

export const escalaService = {
  getAll: async (): Promise<Escala[]> => {
    const response = await api.get('/escalas')
    return response.data
  },

  getByFuncionarioId: async (funcionarioId: number): Promise<Escala[]> => {
    const response = await api.get(`/escalas/funcionario/${funcionarioId}`)
    return response.data
  },

  create: async (data: CreateEscalaDTO): Promise<Escala> => {
    const response = await api.post('/escalas', data)
    return response.data
  },

  update: async (id: number, data: Partial<CreateEscalaDTO>): Promise<Escala> => {
    const response = await api.put(`/escalas/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/escalas/${id}`)
  },
}
