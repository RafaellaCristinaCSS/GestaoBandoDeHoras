# Refatoração do cálculo de horas e vínculo histórico da escala no registro de ponto

## Objetivo

Garantir que:
- todas as horas sejam calculadas a partir da escala válida do funcionário
- cada registro de ponto mantenha referência da escala utilizada naquele momento
- mudanças futuras de escala NÃO alterem registros antigos
- o sistema preserve histórico corretamente

---

# Regra principal

Os cálculos de:
- horas previstas
- atrasos
- faltas
- horas extras
- folgas

DEVEM ser feitos utilizando:
- a escala válida no dia do registro

---

# Problema atual

Atualmente o sistema provavelmente:
- busca a escala atual do funcionário
- recalcula registros antigos usando a escala nova

Isso está errado.

Exemplo do problema:

Funcionário:
- janeiro → escala 44h
- fevereiro → escala 12x36

Se consultar janeiro:
- sistema NÃO pode usar escala 12x36

Os registros antigos precisam continuar vinculados:
- à escala usada na época

---

# Alteração obrigatória

A tabela RegistroPonto deve possuir referência histórica da escala utilizada.

---

# Estrutura necessária

Adicionar em RegistroPonto:

```csharp id="gkpk91"
RegistroPonto
- RegistroPontoId
- FuncionarioId
- Data
- EscalaId
- FuncionarioEscalaId
````

---

# Objetivo de cada campo

## EscalaId

Indica:

* qual escala gerou aquele registro

---

## FuncionarioEscalaId

Indica:

* qual vínculo histórico estava ativo

Isso é importante porque:

* a mesma escala pode sofrer nova versão
* precisamos saber exatamente qual vínculo estava vigente

---

# Regra obrigatória ao criar registro de ponto

Ao gerar registro do dia:

O sistema deve:

## 1. Buscar vínculo histórico válido

```csharp id="q7r2ak"
FuncionarioEscala
.Where(x =>
    x.FuncionarioId == funcionarioId &&
    x.DataInicio <= data &&
    (x.DataFim == null || x.DataFim >= data))
```

---

## 2. Obter escala correspondente

Carregar:

* Escala
* EscalaDia

---

## 3. Salvar referência no RegistroPonto

Persistir:

* EscalaId
* FuncionarioEscalaId

---

# Regra CRÍTICA

Após criado:

* o RegistroPonto NÃO deve depender da escala atual do funcionário

Ele deve:

* utilizar sempre a escala salva nele próprio

---

# Regras de cálculo

Todos os cálculos devem usar:

* EscalaId do RegistroPonto

E NÃO:

* escala atual do funcionário

---

# Cálculos obrigatórios

Calcular a partir da escala:

* horas previstas
* atraso
* saída antecipada
* horas extras
* falta
* presença
* folga

---

# Exemplo esperado

## Escala cadastrada

Segunda:

* entrada 08:00
* saída 18:00

---

## Registro realizado

Entrada:

* 08:30

Resultado:

* atraso de 30 minutos

---

# Outro exemplo

Funcionário mudou de escala:

Até março:

* 44h semanal

Abril:

* 12x36

---

# Resultado esperado

## Consulta março

Usar:

* escala 44h salva no RegistroPonto

---

## Consulta abril

Usar:

* escala 12x36 salva no RegistroPonto

---

# Período mensal do sistema

IMPORTANTE:

O fechamento mensal NÃO é calendário comum.

O período deve ser:

* dia 21 do mês anterior
  até
* dia 20 do mês atual

---

# Exemplos

## Competência Maio

Período:

```text id="otmqhi"
21/04 até 20/05
```

---

## Competência Junho

Período:

```text id="5r2w0u"
21/05 até 20/06
```

---

# Criar helper/utilitário para competência

Criar lógica centralizada para:

```csharp id="9klf8v"
ObterPeriodoCompetencia(mes, ano)
```

Retorno esperado:

```csharp id="nq0wdg"
DataInicio
DataFim
```

---

# Relatórios

Os relatórios mensais devem:

* buscar registros dentro da competência
* usar escala salva no registro
* NÃO recalcular baseado na escala atual

---

# Refatorações necessárias

Atualizar:

* entidades
* DTOs
* migrations
* mappings
* repositories
* services
* cálculos
* relatórios
* exportação Excel
* APIs

---

# Regras importantes

## NÃO atualizar registros antigos automaticamente

Quando escala mudar:

* registros antigos permanecem intactos

---

# Regra importante sobre edição de escala

Se uma escala já foi utilizada historicamente:

* evitar edição destrutiva

Preferencialmente:

* criar nova escala
  OU
* nova versão da escala

---

# Objetivo final

O sistema deve:

* possuir histórico confiável
* manter rastreabilidade
* preservar cálculos antigos
* permitir troca de escala sem quebrar histórico
* gerar relatórios corretos
* funcionar como sistema profissional de ponto

```
```
