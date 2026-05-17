import api from './api'
import { Funcionario, CreateFuncionarioDTO, UpdateFuncionarioDTO } from '@/types/api'

export const funcionarioService = {
  getAll: async (): Promise<Funcionario[]> => {
    const response = await api.get('/funcionarios')
    return response.data
  },

  getById: async (id: number): Promise<Funcionario> => {
    const response = await api.get(`/funcionarios/${id}`)
    return response.data
  },

  create: async (data: CreateFuncionarioDTO): Promise<Funcionario> => {
    const response = await api.post('/funcionarios', data)
    return response.data
  },

  update: async (id: number, data: UpdateFuncionarioDTO): Promise<Funcionario> => {
    const response = await api.put(`/funcionarios/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/funcionarios/${id}`)
  },
}
