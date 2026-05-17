import api from './api'
import { RelatorioResumo } from '@/types/api'

export const relatoriouService = {
  getResumo: async (funcionarioId: number, mes: number, ano: number): Promise<RelatorioResumo> => {
    const response = await api.get('/relatorios/resumo', {
      params: { funcionarioId, mes, ano },
    })
    return response.data
  },

  exportarExcel: async (funcionarioId: number, mes: number, ano: number): Promise<Blob> => {
    const response = await api.get('/relatorios/excel', {
      params: { funcionarioId, mes, ano },
      responseType: 'blob',
    })
    return response.data
  },
}
