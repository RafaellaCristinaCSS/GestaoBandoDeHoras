import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Ferias, CreateFeriasDTO } from '@/types/api'

interface FeriasFormProps {
  onSubmit: (data: CreateFeriasDTO) => Promise<void>
  initialData?: Ferias
  isLoading?: boolean
}

const feriasSchema = z.object({
  funcionarioId: z.coerce.number().min(1),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  observacao: z.string().optional(),
})

export type FeriasFormData = z.infer<typeof feriasSchema>

export function FeriasForm({ onSubmit, initialData, isLoading }: FeriasFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeriasFormData>({
    resolver: zodResolver(feriasSchema) as any,
    defaultValues: initialData || {
      funcionarioId: 0,
      dataInicio: '',
      dataFim: '',
      observacao: '',
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Funcionário *</label>
        <select
          {...register('funcionarioId')}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        >
          <option value="">-- Selecione --</option>
        </select>
        {errors.funcionarioId && (
          <p className="mt-1 text-sm text-red-600">{errors.funcionarioId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Data de Início *</label>
        <input
          {...register('dataInicio')}
          type="date"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        {errors.dataInicio && (
          <p className="mt-1 text-sm text-red-600">{errors.dataInicio.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Data de Fim *</label>
        <input
          {...register('dataFim')}
          type="date"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        {errors.dataFim && (
          <p className="mt-1 text-sm text-red-600">{errors.dataFim.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Observação</label>
        <textarea
          {...register('observacao')}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          placeholder="Observações..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
      >
        {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
      </button>
    </form>
  )
}
