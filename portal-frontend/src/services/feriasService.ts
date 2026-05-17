import api from './api'
import { Ferias, CreateFeriasDTO } from '@/types/api'

export const feriasService = {
  getAll: async (): Promise<Ferias[]> => {
    const response = await api.get('/ferias')
    return response.data
  },

  getById: async (id: number): Promise<Ferias> => {
    const response = await api.get(`/ferias/${id}`)
    return response.data
  },

  create: async (data: CreateFeriasDTO): Promise<Ferias> => {
    const response = await api.post('/ferias', data)
    return response.data
  },

  update: async (id: number, data: Partial<CreateFeriasDTO>): Promise<Ferias> => {
    const response = await api.put(`/ferias/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ferias/${id}`)
  },
}
