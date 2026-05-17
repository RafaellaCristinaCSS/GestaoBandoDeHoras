import api from './api'
import { RegistroPonto, CreateRegistroPontoDTO } from '@/types/api'

export const registroPontoService = {
  getAll: async (funcionarioId?: number, mes?: number, ano?: number): Promise<RegistroPonto[]> => {
    const params = { funcionarioId, mes, ano }
    const response = await api.get('/registro-ponto', { params })
    return response.data
  },

  getById: async (id: number): Promise<RegistroPonto> => {
    const response = await api.get(`/registro-ponto/${id}`)
    return response.data
  },

  create: async (data: CreateRegistroPontoDTO): Promise<RegistroPonto> => {
    const response = await api.post('/registro-ponto', data)
    return response.data
  },

  update: async (id: number, data: Partial<CreateRegistroPontoDTO>): Promise<RegistroPonto> => {
    const response = await api.put(`/registro-ponto/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/registro-ponto/${id}`)
  },
}
