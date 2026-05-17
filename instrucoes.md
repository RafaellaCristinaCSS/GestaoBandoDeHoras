# Sistema de Gestão de Funcionários - Frontend

## Objetivo

Criar um frontend simples, rápido e intuitivo para controle de funcionários, presença, horários trabalhados e férias. Front, React, TypeScript, Vite, Tailwind, shadcn/ui (preciso conseguir hospedar o front no github page)

O sistema será utilizado apenas pelo gestor da empresa para:

- cadastrar funcionários
- lançar horas trabalhadas
- controlar faltas e atrasos
- visualizar resumo mensal
- exportar relatório em Excel

O sistema NÃO precisa:
- autenticação complexa
- múltiplos perfis
- permissões avançadas
- dashboard complexo
- gráficos
- notificações
- responsividade perfeita mobile

O foco deve ser:
- simplicidade
- velocidade
- facilidade de uso
- poucos cliques

---

# Stack desejada

Frontend:
- React
- TypeScript
- Vite

Bibliotecas:
- React Router DOM
- Axios
- React Hook Form
- Zod
- TanStack Query
- TailwindCSS
- shadcn/ui
- lucide-react

---

# Estrutura visual

Criar layout simples com:

## Sidebar lateral

Itens:
- Funcionários
- Registro de Ponto
- Férias
- Relatórios

## Header simples

Mostrar:
- nome do sistema
- data atual

---

# Padrão visual

Visual limpo e administrativo.

Utilizar:
- cards simples
- tabelas organizadas
- poucos detalhes visuais
- foco em produtividade

Evitar:
- animações exageradas
- excesso de cores
- telas muito carregadas

---

# TELAS

---

# 1. Tela de Funcionários

## Objetivo

Cadastrar e gerenciar funcionários.

---

## Funcionalidades

### Listagem

Tabela com:
- nome
- cargo
- carga horária semanal
- ativo

Ações:
- editar
- remover

---

## Cadastro/Edição

Campos:
- nome
- cargo
- cargaHorariaSemanal
- ativo

Validações:
- nome obrigatório
- cargo obrigatório
- cargaHorariaSemanal obrigatória

---

# 2. Tela de Escala

## Objetivo

Definir dias e horários de trabalho do funcionário.

Cada funcionário possui:
- dias trabalhados
- horário padrão

Exemplo:
- segunda a quinta: 08:00 às 18:00
- sexta: 08:00 às 17:00

---

## Funcionalidades

### Selecionar funcionário

Ao selecionar:
- carregar escala cadastrada

---

## Cadastro da escala

Campos:
- diaSemana
- horaInicio
- horaFim
- horasPrevistas
- folga

Permitir múltiplos registros por funcionário.

Exemplo:
| Dia | Entrada | Saída | Folga |
|------|------|------|------|
| Segunda | 08:00 | 18:00 | Não |
| Sexta | 08:00 | 17:00 | Não |
| Domingo | - | - | Sim |

---

# 3. Tela de Registro de Ponto

## Objetivo

Lançar manualmente horas trabalhadas.

Essa é a tela mais importante do sistema.

---

# Layout

## Filtros superiores

Campos:
- funcionário
- mês
- ano

Botão:
- carregar registros

---

# Tabela mensal

Mostrar TODOS os dias do mês.

Colunas:
- data
- dia da semana
- entrada
- almoço início
- almoço fim
- saída
- presença
- observação
- status

---

# Regras

## Status automático

Sistema deve calcular:
- Presente
- Falta
- Folga
- Atrasado

Comparar com escala cadastrada.

---

# Funcionalidades

## Edição inline

Permitir editar diretamente na tabela:
- horários
- presença
- observação

---

# Cálculos automáticos

Ao salvar:
- calcular horas trabalhadas
- calcular atraso
- calcular horas extras

---

# UX importante

Ao trocar funcionário:
- carregar automaticamente mês atual

Ao mudar mês:
- recarregar tabela

---

# 4. Tela de Férias

## Objetivo

Cadastrar períodos de férias.

---

## Listagem

Mostrar:
- funcionário
- data início
- data fim

---

## Cadastro

Campos:
- funcionário
- dataInicio
- dataFim
- observação

---

# 5. Tela de Relatórios

## Objetivo

Gerar resumo mensal.

---

# Filtros

Campos:
- funcionário
- mês
- ano

Botões:
- gerar relatório
- exportar excel

---

# Resumo exibido

Mostrar:
- total de horas trabalhadas
- faltas
- atrasos
- horas extras
- dias presentes
- dias de folga

---

# Exportação Excel

Gerar arquivo contendo:
- funcionário
- data
- entrada
- saída
- horas trabalhadas
- atraso
- presença

Nome do arquivo:
Relatorio_Funcionario_Mes_Ano.xlsx

---

# APIs esperadas

Utilizar integração REST.

Exemplo:

## Funcionários
- GET /funcionarios
- POST /funcionarios
- PUT /funcionarios/{id}
- DELETE /funcionarios/{id}

---

## Escalas
- GET /escalas
- GET /escalas/funcionario/{id}
- POST /escalas
- PUT /escalas/{id}

---

## Registro de ponto
- GET /registro-ponto
- POST /registro-ponto
- PUT /registro-ponto/{id}

---

## Férias
- GET /ferias
- POST /ferias
- PUT /ferias/{id}

---

# Estrutura de pastas sugerida

src/
- components/
- pages/
- services/
- hooks/
- layouts/
- routes/
- types/
- utils/

---

# Componentes importantes

Criar componentes reutilizáveis:

- DataTable
- PageHeader
- ConfirmDialog
- Loading
- EmptyState
- FormField

---

# Regras técnicas

- utilizar TypeScript fortemente tipado
- criar DTOs
- utilizar react-query para cache
- criar interceptador axios
- tratar loading e erro
- evitar lógica dentro das telas
- separar services

---

# Melhorias desejadas

Adicionar:
- tema claro/escuro
- toast de sucesso/erro
- confirmação ao excluir
- máscaras de horário

---

# Objetivo final

O sistema deve parecer:
- simples
- rápido
- profissional
- fácil para uma pessoa sem conhecimento técnico utilizar

Priorizar:
- produtividade
- clareza visual
- poucos cliques
- manutenção simples