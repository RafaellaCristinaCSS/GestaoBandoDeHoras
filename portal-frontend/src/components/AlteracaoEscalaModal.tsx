import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Select from 'react-select'
import { Modal } from '@/components/Modal'
import { alteracaoEscalaService } from '@/services/alteracaoEscalaService'
import { escalaService } from '@/services/escalaService'
import {
  Funcionario,
  RegistroAlteracaoDecisao,
  RegistroDivergencia,
  RegistroEstadoManual,
  SimulacaoAlteracaoEscalaResult,
  TipoEscala,
} from '@/types/api'

type Props = {
  funcionario: Funcionario
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

type DecisaoMap = Record<number, RegistroAlteracaoDecisao>

const formatDateLabel = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')

function EstadoCard({ titulo, estado }: { titulo: string; estado: RegistroDivergencia['antes'] }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{titulo}</div>
      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex flex-wrap gap-x-2"><span className="shrink-0 font-semibold">Status:</span> <span>{estado.status}</span></div>
        <div className="flex flex-wrap gap-x-2"><span className="shrink-0 font-semibold">Jornada:</span> <span>{estado.jornadaPrevista}</span></div>
        {estado.entrada && <div className="flex flex-wrap gap-x-2"><span className="shrink-0 font-semibold">Entrada:</span> <span>{estado.entrada}</span></div>}
        {estado.saida && <div className="flex flex-wrap gap-x-2"><span className="shrink-0 font-semibold">Saída:</span> <span>{estado.saida}</span></div>}
        <div className="flex flex-wrap gap-x-2"><span className="shrink-0 font-semibold">Saldo:</span> <span>{estado.saldoHorasFormatado}</span></div>
      </div>
    </div>
  )
}

function ManualEditor({
  value,
  onChange,
}: {
  value: RegistroEstadoManual
  onChange: (value: RegistroEstadoManual) => void
}) {
  return (
    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
      <div className="mb-2 font-semibold text-blue-900">Edição manual</div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {([
          ['presenca', 'Presença'],
          ['folga', 'Folga'],
          ['feriado', 'Feriado'],
          ['atestadoMedico', 'Atestado'],
          ['ferias', 'Férias'],
        ] as const).map(([field, label]) => (
          <label key={field} className="inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={value[field]}
              onChange={(e) => onChange({ ...value, [field]: e.target.checked })}
              className="rounded border-slate-300"
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {([
          ['entrada', 'Entrada'],
          ['almocInicio', 'Almoço início'],
          ['almocFim', 'Almoço fim'],
          ['saida', 'Saída'],
        ] as const).map(([field, label]) => (
          <div key={field}>
            <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
            <input
              type="time"
              value={value[field] ?? ''}
              onChange={(e) => onChange({ ...value, [field]: e.target.value || undefined })}
              className="w-full rounded border border-slate-300 px-2 py-1 text-slate-900"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function buildManualFromResultado(resultado: RegistroDivergencia['resultadoSugerido']): RegistroEstadoManual {
  const status = resultado.status.toLowerCase()
  return {
    presenca: status.includes('presente') || status.includes('atraso') || status.includes('extra'),
    folga: status.includes('folga'),
    feriado: status.includes('feriado'),
    atestadoMedico: status.includes('atestado'),
    ferias: status.includes('férias') || status.includes('ferias'),
    entrada: resultado.entrada,
    almocInicio: resultado.almocInicio,
    almocFim: resultado.almocFim,
    saida: resultado.saida,
  }
}

export function AlteracaoEscalaModal({ funcionario, isOpen, onClose, onSuccess, onError }: Props) {
  const queryClient = useQueryClient()
  const [novaEscalaId, setNovaEscalaId] = useState<number | null>(null)
  const [dataVigencia, setDataVigencia] = useState('')
  const [trabalhaDiaPar, setTrabalhaDiaPar] = useState<boolean | null>(null)
  const [simulacao, setSimulacao] = useState<SimulacaoAlteracaoEscalaResult | null>(null)
  const [mostrarApenasDivergencias, setMostrarApenasDivergencias] = useState(true)
  const [decisoes, setDecisoes] = useState<DecisaoMap>({})

  const { data: escalas } = useQuery({
    queryKey: ['escalas'],
    queryFn: escalaService.getAll,
    enabled: isOpen,
  })

  const escalaSelecionada = escalas?.find((escala) => escala.id === novaEscalaId)
  const isDoze36 = escalaSelecionada?.tipoEscala === TipoEscala.Doze36

  const escalaOptions = (escalas ?? [])
    .filter((escala) => escala.ativa && escala.id !== funcionario.escalaId)
    .map((escala) => ({
      value: escala.id,
      label: `${escala.nome} (${escala.cargaHorariaSemanal}h)`,
    }))

  const simularMutation = useMutation({
    mutationFn: () =>
      alteracaoEscalaService.simular({
        funcionarioId: funcionario.id,
        novaEscalaId: novaEscalaId!,
        dataVigencia,
        trabalhaDiaPar: isDoze36 ? trabalhaDiaPar ?? undefined : undefined,
      }),
    onSuccess: (result) => {
      setSimulacao(result)
      const initialDecisoes: DecisaoMap = {}
      result.registros
        .filter((item) => item.possuiDivergencia)
        .forEach((item) => {
          initialDecisoes[item.registroId] = {
            registroId: item.registroId,
            acao: 'aplicar_sugestao',
          }
        })
      setDecisoes(initialDecisoes)
    },
    onError: () => onError('Erro ao simular alteração de escala'),
  })

  const confirmarMutation = useMutation({
    mutationFn: () =>
      alteracaoEscalaService.confirmar({
        funcionarioId: funcionario.id,
        novaEscalaId: novaEscalaId!,
        dataVigencia,
        trabalhaDiaPar: isDoze36 ? trabalhaDiaPar ?? undefined : undefined,
        usuarioId: 0,
        decisoes: Object.values(decisoes),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      queryClient.invalidateQueries({ queryKey: ['registros-ponto'] })
      onSuccess('Alteração de escala confirmada com sucesso!')
      handleClose()
    },
    onError: () => onError('Erro ao confirmar alteração de escala'),
  })

  const registrosVisiveis = useMemo(() => {
    if (!simulacao) return []
    return simulacao.registros.filter((item) => !mostrarApenasDivergencias || item.possuiDivergencia)
  }, [simulacao, mostrarApenasDivergencias])

  const handleClose = () => {
    setNovaEscalaId(null)
    setDataVigencia('')
    setTrabalhaDiaPar(null)
    setSimulacao(null)
    setDecisoes({})
    setMostrarApenasDivergencias(true)
    onClose()
  }

  const podeSimular =
    Boolean(novaEscalaId) &&
    Boolean(dataVigencia) &&
    (!isDoze36 || trabalhaDiaPar !== null)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Alterar escala — ${funcionario.nome}`} size="wide">
      <div className="space-y-6">
        {!simulacao ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Escala atual</label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {funcionario.escalaNome ?? 'Sem escala vinculada'}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nova escala *</label>
                <Select
                  options={escalaOptions}
                  value={escalaOptions.find((option) => option.value === novaEscalaId) ?? null}
                  onChange={(option) => {
                    setNovaEscalaId(option?.value ?? null)
                    setTrabalhaDiaPar(null)
                  }}
                  placeholder="Selecione a nova escala"
                  isSearchable
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Data de início da vigência *</label>
                <input
                  type="date"
                  value={dataVigencia}
                  onChange={(e) => setDataVigencia(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              {isDoze36 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Paridade 12x36 *</label>
                  <select
                    value={trabalhaDiaPar === null ? '' : trabalhaDiaPar ? 'par' : 'impar'}
                    onChange={(e) => setTrabalhaDiaPar(e.target.value === 'par')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  >
                    <option value="">Selecione</option>
                    <option value="par">Dias pares</option>
                    <option value="impar">Dias ímpares</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!podeSimular || simularMutation.isPending}
              onClick={() => simularMutation.mutate()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-slate-400"
            >
              {simularMutation.isPending ? 'Simulando...' : 'Simular Alteração'}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div><span className="font-semibold">Funcionário:</span> {simulacao.funcionarioNome}</div>
                <div><span className="font-semibold">Escala atual:</span> {simulacao.escalaAtualNome}</div>
                <div><span className="font-semibold">Nova escala:</span> {simulacao.novaEscalaNome}</div>
                <div><span className="font-semibold">Vigência:</span> {formatDateLabel(simulacao.dataVigencia)}</div>
                <div><span className="font-semibold">Registros analisados:</span> {simulacao.totalRegistrosAnalisados}</div>
                <div><span className="font-semibold">Registros impactados:</span> {simulacao.totalRegistrosImpactados}</div>
              </div>
            </div>

            {simulacao.afetaRegistrosHistoricos && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {simulacao.avisoHistorico}
              </div>
            )}

            {simulacao.totalRegistrosImpactados === 0 ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Nenhuma divergência foi encontrada. Deseja confirmar a alteração?
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={mostrarApenasDivergencias}
                  onChange={(e) => setMostrarApenasDivergencias(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Mostrar apenas divergências
              </label>
            )}

            <div className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
              {registrosVisiveis.map((item) => (
                <div key={item.registroId} className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {formatDateLabel(item.data)}
                      {item.possuiDivergencia && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                          Divergência
                        </span>
                      )}
                    </div>
                    {item.possuiDivergencia && (
                      <select
                        value={decisoes[item.registroId]?.acao ?? 'aplicar_sugestao'}
                        onChange={(e) => {
                          const acao = e.target.value as RegistroAlteracaoDecisao['acao']
                          setDecisoes((prev) => ({
                            ...prev,
                            [item.registroId]: {
                              registroId: item.registroId,
                              acao,
                              manual:
                                acao === 'manual'
                                  ? prev[item.registroId]?.manual ?? buildManualFromResultado(item.resultadoSugerido)
                                  : undefined,
                            },
                          }))
                        }}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="aplicar_sugestao">Aplicar sugestão</option>
                        <option value="manter_atual">Manter registro atual</option>
                        <option value="manual">Alterar manualmente</option>
                      </select>
                    )}
                  </div>

                  {item.possuiDivergencia && item.sugestaoAutomatica && (
                    <div className="mb-3 text-xs text-blue-700">
                      Sugestão: {item.sugestaoAutomatica}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <EstadoCard titulo="Antes" estado={item.antes} />
                    <EstadoCard titulo="Nova escala" estado={item.novaEscala} />
                    <EstadoCard titulo="Resultado sugerido" estado={item.resultadoSugerido} />
                  </div>

                  {decisoes[item.registroId]?.acao === 'manual' && decisoes[item.registroId]?.manual && (
                    <ManualEditor
                      value={decisoes[item.registroId]!.manual!}
                      onChange={(manual) =>
                        setDecisoes((prev) => ({
                          ...prev,
                          [item.registroId]: {
                            registroId: item.registroId,
                            acao: 'manual',
                            manual,
                          },
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSimulacao(null)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={confirmarMutation.isPending}
                onClick={() => confirmarMutation.mutate()}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-slate-400"
              >
                {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
