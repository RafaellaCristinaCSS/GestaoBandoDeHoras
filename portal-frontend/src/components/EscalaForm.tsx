import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Escala, TipoEscala } from '@/types/api'

const detalheSchema = z.object({
  diaSemana: z.coerce.number().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM').optional().or(z.literal('')),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM').optional().or(z.literal('')),
  horaAlmocoInicio: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM').optional().or(z.literal('')),
  horaAlmocoFim: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM').optional().or(z.literal('')),
  horasPrevistas: z.coerce.number().min(0),
  folga: z.boolean(),
})

const escalaSchema = z.object({
  nome: z.string().min(1, 'Nome Ã© obrigatÃ³rio'),
  descricao: z.string().optional(),
  cargaHorariaSemanal: z.coerce.number().min(0),
  tipoEscala: z.coerce.number(),
  trabalhaDiaParPadrao: z.boolean().nullable().optional(),
  ativa: z.boolean(),
  detalhes: z.array(detalheSchema),
})

export type EscalaFormData = z.infer<typeof escalaSchema>

const diasSemana = [
  'Segunda', 'TerÃ§a', 'Quarta', 'Quinta', 'Sexta', 'SÃ¡bado', 'Domingo',
]

const criarDetalhesSemanaisPadrao = () => diasSemana.map((_, i) => ({
  diaSemana: i,
  horaInicio: i < 5 ? '07:00' : '00:00',
  horaFim: i < 4 ? '17:00' : i === 4 ? '16:00' : '00:00',
  horaAlmocoInicio: i < 5 ? '12:00' : '',
  horaAlmocoFim: i < 5 ? '13:00' : '',
  horasPrevistas: i < 4 ? 9 : i === 4 ? 8 : 0,
  folga: i >= 5,
}))

const criarDetalhesDoze36 = (trabalhaDiaParPadrao?: boolean | null) =>
  diasSemana.map((_, index) => {
    const diaNumero = index + 1
    const diaPar = diaNumero % 2 === 0
    const trabalhaNesseDia = trabalhaDiaParPadrao == null ? !diaPar : trabalhaDiaParPadrao ? diaPar : !diaPar

    return {
      diaSemana: index,
      horaInicio: trabalhaNesseDia ? '07:00' : '00:00',
      horaFim: trabalhaNesseDia ? '19:00' : '00:00',
      horaAlmocoInicio: trabalhaNesseDia ? '12:00' : '',
      horaAlmocoFim: trabalhaNesseDia ? '13:00' : '',
      horasPrevistas: trabalhaNesseDia ? 11 : 0,
      folga: !trabalhaNesseDia,
    }
  })

interface EscalaFormProps {
  onSubmit: (data: EscalaFormData) => Promise<void>
  initialData?: Escala
  isLoading?: boolean
}

export function EscalaForm({ onSubmit, initialData, isLoading }: EscalaFormProps) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EscalaFormData>({
    resolver: zodResolver(escalaSchema) as any,
    defaultValues: initialData
      ? {
          nome: initialData.nome,
          descricao: initialData.descricao ?? '',
          cargaHorariaSemanal: initialData.cargaHorariaSemanal,
          tipoEscala: initialData.tipoEscala,
          trabalhaDiaParPadrao: initialData.trabalhaDiaParPadrao ?? null,
          ativa: initialData.ativa,
          detalhes: initialData.detalhes.map(d => ({
            diaSemana: d.diaSemana,
            horaInicio: d.horaInicio,
            horaFim: d.horaFim,
            horaAlmocoInicio: d.horaAlmocoInicio ?? '',
            horaAlmocoFim: d.horaAlmocoFim ?? '',
            horasPrevistas: d.horasPrevistas,
            folga: d.folga,
          })),
        }
      : {
          nome: '',
          descricao: '',
          cargaHorariaSemanal: 44,
          tipoEscala: TipoEscala.Semanal,
          trabalhaDiaParPadrao: null,
          ativa: true,
          detalhes: criarDetalhesSemanaisPadrao(),
        },
  })

  const { fields } = useFieldArray({ control, name: 'detalhes' })

  const tipoEscala = Number(watch('tipoEscala'))
  const trabalhaDiaParPadrao = watch('trabalhaDiaParPadrao')
  const detalhes = watch('detalhes')
  const isDoze36 = tipoEscala === TipoEscala.Doze36

  const cargaHorariaDoze36 = useMemo(() => {
    const detalheTrabalho = detalhes?.find((d) => !d.folga && d.horasPrevistas > 0)
    const horasTurno = detalheTrabalho?.horasPrevistas ?? 11
    return Number((horasTurno * 3.5).toFixed(1))
  }, [detalhes])

  useEffect(() => {
    if (isDoze36) {
      setValue('cargaHorariaSemanal', cargaHorariaDoze36, { shouldValidate: true })
      setValue('detalhes', criarDetalhesDoze36(trabalhaDiaParPadrao), { shouldValidate: true })
    } else if (trabalhaDiaParPadrao != null) {
      setValue('trabalhaDiaParPadrao', null, { shouldValidate: true })
    }
  }, [isDoze36, cargaHorariaDoze36, trabalhaDiaParPadrao, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Nome *</label>
          <input
            {...register('nome')}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
            placeholder="Ex.: 44h semanais segunda a sexta"
          />
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">DescriÃ§Ã£o</label>
          <input
            {...register('descricao')}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
          />
        </div>
<div>
          <label className="block text-sm font-medium text-slate-700">Tipo de escala</label>
          <select
            {...register('tipoEscala')}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
          >
            <option value={TipoEscala.Semanal}>Semanal</option>
            <option value={TipoEscala.Doze36}>12x36</option>
            <option value={TipoEscala.Personalizada}>Personalizada</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Carga horÃ¡ria semanal (h)</label>
          <input
            {...register('cargaHorariaSemanal')}
            type="number"
            disabled={isDoze36}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
          {isDoze36 && (
            <p className="mt-1 text-xs text-slate-500">
              Em 12x36, a carga Ã© calculada automaticamente ({cargaHorariaDoze36}h/semana).
            </p>
          )}
        </div>

        {isDoze36 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Padrão 12x36</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="trabalhaDiaParPadrao"
                  checked={trabalhaDiaParPadrao === true}
                  onChange={() => setValue('trabalhaDiaParPadrao', true, { shouldValidate: true })}
                />
                Par
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="trabalhaDiaParPadrao"
                  checked={trabalhaDiaParPadrao === false}
                  onChange={() => setValue('trabalhaDiaParPadrao', false, { shouldValidate: true })}
                />
                Ímpar
              </label>
            </div>
          </div>
        )}

        <div className="col-span-2 flex items-center gap-2">
          <input {...register('ativa')} type="checkbox" className="rounded border-slate-300" />
          <label className="text-sm font-medium text-slate-700">Escala ativa</label>
        </div>

      </div>

      {!isDoze36 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Horários por dia</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-600">Dia</th>
                  <th className="px-3 py-2 text-left text-slate-600">Folga</th>
                  <th className="px-3 py-2 text-left text-slate-600">Entrada</th>
                  <th className="px-3 py-2 text-left text-slate-600">Saída</th>
                  <th className="px-3 py-2 text-left text-slate-600">Alm. início</th>
                  <th className="px-3 py-2 text-left text-slate-600">Alm. fim</th>
                  <th className="px-3 py-2 text-left text-slate-600">Horas</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const isFolga = detalhes?.[index]?.folga
                  return (
                    <tr key={field.id} className="border-t">
                      <td className="px-3 py-2 font-medium text-slate-700">
                        {diasSemana[detalhes?.[index]?.diaSemana ?? index]}
                        <input type="hidden" {...register(`detalhes.${index}.diaSemana`)} />
                      </td>
                      <td className="px-3 py-2">
                        <input {...register(`detalhes.${index}.folga`)} type="checkbox" />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          {...register(`detalhes.${index}.horaInicio`)}
                          type="time"
                          disabled={isFolga}
                          className="w-28 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          {...register(`detalhes.${index}.horaFim`)}
                          type="time"
                          disabled={isFolga}
                          className="w-28 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          {...register(`detalhes.${index}.horaAlmocoInicio`)}
                          type="time"
                          disabled={isFolga}
                          className="w-28 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          {...register(`detalhes.${index}.horaAlmocoFim`)}
                          type="time"
                          disabled={isFolga}
                          className="w-28 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          {...register(`detalhes.${index}.horasPrevistas`)}
                          type="number"
                          step="0.5"
                          disabled={isFolga}
                          className="w-16 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
