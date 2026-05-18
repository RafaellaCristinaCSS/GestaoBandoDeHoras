import api from './api'
import { Cargo, CreateCargoDTO } from '@/types/api'

export const cargoService = {
  getAll: async (): Promise<Cargo[]> => {
    const response = await api.get('/cargos')
    return response.data
  },

  create: async (data: CreateCargoDTO): Promise<Cargo> => {
    const response = await api.post('/cargos', data)
    return response.data
  },
}
