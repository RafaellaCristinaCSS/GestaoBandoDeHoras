import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as z from 'zod'
import Select from 'react-select'



import { Funcionario, CreateFuncionarioDTO } from '@/types/api'
import { cargoService } from '@/services/cargoService'
import { escalaService } from '@/services/escalaService'

interface FuncionarioFormProps {
  onSubmit: (data: CreateFuncionarioDTO) => Promise<void>
  initialData?: Funcionario
  isLoading?: boolean
}

const funcionarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  escalaId: z.coerce.number().min(1, 'Escala é obrigatória'),
  ativo: z.boolean(),
})

export type FuncionarioFormData = z.infer<typeof funcionarioSchema>


export function FuncionarioForm({ onSubmit, initialData, isLoading }: FuncionarioFormProps) {
  const queryClient = useQueryClient()
  const [showAddCargo, setShowAddCargo] = useState(false)
  const [novoCargo, setNovoCargo] = useState('')
  const selectMenuPortalTarget = typeof document !== 'undefined' ? document.body : null
  const isEditing = Boolean(initialData)
  const defaultValues: FuncionarioFormData = initialData
    ? {
        nome: initialData.nome,
        cargo: initialData.cargo,
        escalaId: initialData.escalaId ?? 0,
        ativo: initialData.ativo,
      }
    : {
        nome: '',
        cargo: '',
        escalaId: 0,
        ativo: true,
      }

  const { data: cargos, isLoading: isLoadingCargos } = useQuery({
    queryKey: ['cargos'],
    queryFn: cargoService.getAll,
  })

  const { data: escalas, isLoading: isLoadingEscalas } = useQuery({
    queryKey: ['escalas'],
    queryFn: escalaService.getAll,
  })

  const createCargoMutation = useMutation({
    mutationFn: (nome: string) => cargoService.create({ nome }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] })
      setValue('cargo', created.nome)
      setNovoCargo('')
      setShowAddCargo(false)
    },
  })

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },

  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema) as any,
    defaultValues,
  });

  const handleAddCargo = () => {
    const nome = novoCargo.trim()
    if (!nome) return
    createCargoMutation.mutate(nome)
  }

  const cargoOptions = (cargos ?? []).map((cargo) => ({
    value: cargo.nome,
    label: cargo.nome,
  }))

  const escalaOptions = (escalas ?? [])
    .filter((escala) => escala.ativa)
    .map((escala) => ({
      value: escala.id,
      label: `${escala.nome} (${escala.cargaHorariaSemanal}h)`,
    }))

  const escalaSelecionadaAtual = initialData?.escalaId && initialData.escalaNome
    ? {
        value: initialData.escalaId,
        label: initialData.escalaNome,
      }
    : null

  const escalaOptionsComAtual = escalaSelecionadaAtual && !escalaOptions.some((option) => option.value === escalaSelecionadaAtual.value)
    ? [escalaSelecionadaAtual, ...escalaOptions]
    : escalaOptions

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="space-y-4">
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
        <div className="flex gap-2 items-center">
          <div className="mt-1 w-full">
            <Controller
              name="cargo"
              control={control}
              render={({ field }) => (
                <Select
                  inputId="cargo"
                  options={cargoOptions}
                  isClearable
                  isSearchable
                  isLoading={isLoadingCargos}
                  placeholder="Selecione o cargo"
                  noOptionsMessage={() => 'Nenhum cargo encontrado'}
                  value={cargoOptions.find((option) => option.value === field.value) ?? null}
                  onChange={(option) => field.onChange(option?.value ?? '')}
                  menuPortalTarget={selectMenuPortalTarget}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 70 }),
                  }}
                />
              )}
            />
          </div>
          <button
            type="button"
            className="bg-green-500 text-white rounded px-2 py-1 text-lg hover:bg-green-600"
            onClick={() => setShowAddCargo((v) => !v)}
            title="Adicionar novo cargo"
          >
            +
          </button>
        </div>
        {showAddCargo && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={novoCargo}
              onChange={(e) => setNovoCargo(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Novo cargo"
            />
            <button
              type="button"
              className="bg-blue-500 text-white rounded px-3 py-2 hover:bg-blue-600"
              onClick={handleAddCargo}
              disabled={createCargoMutation.isPending}
            >
              {createCargoMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              className="bg-slate-300 text-slate-700 rounded px-3 py-2 hover:bg-slate-400"
              onClick={() => { setShowAddCargo(false); setNovoCargo(''); }}
            >
              Cancelar
            </button>
          </div>
        )}
        {errors.cargo && <p className="mt-1 text-sm text-red-600">{errors.cargo.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Escala *</label>
        <div className="mt-1">
          <Controller
            name="escalaId"
            control={control}
            render={({ field }) => (
              <Select
                inputId="escalaId"
                options={escalaOptionsComAtual}
                isClearable={!isEditing}
                isSearchable
                isLoading={isLoadingEscalas}
                isDisabled={isEditing}
                placeholder={isEditing ? 'Escala bloqueada para edição' : 'Busque e selecione a escala'}
                noOptionsMessage={() => 'Nenhuma escala ativa encontrada'}
                value={escalaOptionsComAtual.find((option) => option.value === field.value) ?? null}
                onChange={(option) => field.onChange(option?.value ?? 0)}
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 70 }),
                }}
              />
            )}
          />
        </div>
        
        {errors.escalaId && <p className="mt-1 text-sm text-red-600">{errors.escalaId.message}</p>}
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
  );
}
