import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Select from 'react-select'
import { Ferias, CreateFeriasDTO, Funcionario } from '@/types/api'

interface FeriasFormProps {
  onSubmit: (data: CreateFeriasDTO) => Promise<void>
  initialData?: Ferias
  funcionarios?: Funcionario[]
  isLoading?: boolean
}

const feriasSchema = z
  .object({
    funcionarioId: z.coerce.number().min(1, 'Selecione um funcionário'),
    dataInicio: z.string().min(1, 'Data de início é obrigatória'),
    dataFim: z.string().min(1, 'Data de fim é obrigatória'),
    observacao: z.string().optional(),
  })
  .refine(
    (data) => !data.dataInicio || !data.dataFim || data.dataFim >= data.dataInicio,
    {
      message: 'A data final deve ser maior ou igual à data inicial',
      path: ['dataFim'],
    }
  )

export type FeriasFormData = z.infer<typeof feriasSchema>

const toInputDate = (value?: string) => {
  if (!value) return ''
  return value.length >= 10 ? value.slice(0, 10) : value
}

export function FeriasForm({ onSubmit, initialData, funcionarios = [], isLoading }: FeriasFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FeriasFormData>({
    resolver: zodResolver(feriasSchema) as any,
    defaultValues: initialData
      ? {
          funcionarioId: initialData.funcionarioId,
          dataInicio: toInputDate(initialData.dataInicio),
          dataFim: toInputDate(initialData.dataFim),
          observacao: initialData.observacao ?? '',
        }
      : {
          funcionarioId: 0,
          dataInicio: '',
          dataFim: '',
          observacao: '',
        },
  })

  const funcionarioId = watch('funcionarioId')
  const funcionarioOptions = funcionarios.map((f) => ({ value: f.id, label: f.nome }))
  const selectedFuncionarioOption =
    funcionarioOptions.find((o) => o.value === Number(funcionarioId)) ?? null

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Funcionário *</label>
        <Select
          options={funcionarioOptions}
          value={selectedFuncionarioOption}
          onChange={(option) => setValue('funcionarioId', option?.value ?? 0, { shouldValidate: true })}
          placeholder="Selecione um funcionário"
          isClearable
          className="mt-1"
          classNamePrefix="react-select"
        />
        {errors.funcionarioId && (
          <p className="mt-1 text-sm text-red-600">{errors.funcionarioId.message}</p>
        )}
      </div>

      {funcionarioId > 0 && (
        <>
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
        </>
      )}

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
        disabled={isLoading || funcionarioId <= 0}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
      >
        {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Salvar'}
      </button>
    </form>
  )
}
