import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Escala, CreateEscalaDTO } from '@/types/api'

interface EscalaFormProps {
  funcionarioId: number
  onSubmit: (data: CreateEscalaDTO) => Promise<void>
  initialData?: Escala
  isLoading?: boolean
}

const escalaSchema = z.object({
  diaSemana: z.coerce.number().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
  horasPrevistas: z.coerce.number().min(0),
  folga: z.boolean(),
})

export type EscalaFormData = z.infer<typeof escalaSchema>

const diasSemana = [
  { value: 0, label: 'Segunda' },
  { value: 1, label: 'Terça' },
  { value: 2, label: 'Quarta' },
  { value: 3, label: 'Quinta' },
  { value: 4, label: 'Sexta' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
]

export function EscalaForm({ funcionarioId, onSubmit, initialData, isLoading }: EscalaFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EscalaFormData>({
    resolver: zodResolver(escalaSchema),
    defaultValues: initialData || {
      diaSemana: 0,
      horaInicio: '08:00',
      horaFim: '18:00',
      horasPrevistas: 8,
      folga: false,
    },
  })

  const folga = watch('folga')
  const horaInicio = watch('horaInicio')
  const horaFim = watch('horaFim')

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          funcionarioId,
          ...data,
        })
      )}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">Dia da Semana *</label>
        <select
          {...register('diaSemana')}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
        >
          {diasSemana.map((dia) => (
            <option key={dia.value} value={dia.value}>
              {dia.label}
            </option>
          ))}
        </select>
        {errors.diaSemana && (
          <p className="mt-1 text-sm text-red-600">{errors.diaSemana.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 mb-4">
          <input {...register('folga')} type="checkbox" className="rounded border-slate-300" />
          <span className="text-sm font-medium text-slate-700">Dia de Folga</span>
        </label>
      </div>

      {!folga && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Entrada *</label>
              <input
                {...register('horaInicio')}
                type="time"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.horaInicio && (
                <p className="mt-1 text-sm text-red-600">{errors.horaInicio.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Saída *</label>
              <input
                {...register('horaFim')}
                type="time"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.horaFim && (
                <p className="mt-1 text-sm text-red-600">{errors.horaFim.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Horas Previstas *</label>
            <input
              {...register('horasPrevistas')}
              type="number"
              step="0.5"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.horasPrevistas && (
              <p className="mt-1 text-sm text-red-600">{errors.horasPrevistas.message}</p>
            )}
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
      >
        {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Adicionar'}
      </button>
    </form>
  )
}
