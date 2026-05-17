import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Funcionario, CreateFuncionarioDTO } from '@/types/api'

interface FuncionarioFormProps {
  onSubmit: (data: CreateFuncionarioDTO) => Promise<void>
  initialData?: Funcionario
  isLoading?: boolean
}

const funcionarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  cargaHorariaSemanal: z.coerce.number().min(1, 'Carga horária é obrigatória'),
  ativo: z.boolean(),
})

export type FuncionarioFormData = z.infer<typeof funcionarioSchema>

export function FuncionarioForm({ onSubmit, initialData, isLoading }: FuncionarioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: initialData || {
      nome: '',
      cargo: '',
      cargaHorariaSemanal: 40,
      ativo: true,
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Nome *</label>
        <input
          {...register('nome')}
          type="text"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Digite o nome"
        />
        {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Cargo *</label>
        <input
          {...register('cargo')}
          type="text"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Digite o cargo"
        />
        {errors.cargo && <p className="mt-1 text-sm text-red-600">{errors.cargo.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Carga Horária Semanal *</label>
        <input
          {...register('cargaHorariaSemanal')}
          type="number"
          step="0.5"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
          placeholder="40"
        />
        {errors.cargaHorariaSemanal && (
          <p className="mt-1 text-sm text-red-600">{errors.cargaHorariaSemanal.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input {...register('ativo')} type="checkbox" className="rounded border-slate-300" />
          <span className="text-sm font-medium text-slate-700">Funcionário Ativo</span>
        </label>
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
