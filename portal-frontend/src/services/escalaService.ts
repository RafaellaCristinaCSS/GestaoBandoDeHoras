import api from './api'
import { Escala, CreateEscalaDTO, UpdateEscalaDTO, EscalaDetalhe, CreateEscalaDetalheDTO, UpdateEscalaDetalheDTO } from '@/types/api'

export const escalaService = {
  getAll: async (): Promise<Escala[]> => {
    const response = await api.get('/escalas')
    return response.data
  },

  getById: async (id: number): Promise<Escala> => {
    const response = await api.get(`/escalas/${id}`)
    return response.data
  },

  create: async (data: CreateEscalaDTO): Promise<Escala> => {
    const response = await api.post('/escalas', data)
    return response.data
  },

  update: async (id: number, data: UpdateEscalaDTO): Promise<void> => {
    await api.put(`/escalas/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/escalas/${id}`)
  },

  // ─── Detalhes ──────────────────────────────────────────────────────────────

  addDetalhe: async (escalaId: number, data: CreateEscalaDetalheDTO): Promise<EscalaDetalhe> => {
    const response = await api.post(`/escalas/${escalaId}/detalhes`, data)
    return response.data
  },

  updateDetalhe: async (detalheId: number, data: UpdateEscalaDetalheDTO): Promise<void> => {
    await api.put(`/escalas/detalhes/${detalheId}`, data)
  },

  deleteDetalhe: async (detalheId: number): Promise<void> => {
    await api.delete(`/escalas/detalhes/${detalheId}`)
  },
}
