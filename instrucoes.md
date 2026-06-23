# Implementação de Histórico de Escalas e Assistente de Alteração de Escala

## Objetivo

Implementar um novo fluxo para alteração de escala de funcionários, preservando o histórico das escalas anteriores e permitindo a simulação dos impactos antes da confirmação da alteração.

O sistema **não deve mais substituir diretamente a escala atual do funcionário**. Em vez disso, deve manter um histórico de vínculos entre funcionário e escala, com vigência por período.

Esta implementação deve preservar completamente o funcionamento atual do sistema, alterando apenas o mecanismo de vínculo entre funcionário e escala.

---

# Problema Atual

Hoje o funcionário possui apenas uma escala vinculada.

Quando essa escala é alterada, todos os cálculos futuros e passados passam a utilizar a nova escala, fazendo com que registros antigos deixem de representar corretamente a realidade da época.

Isso impossibilita manter o histórico correto dos registros de ponto.

---

# Nova Modelagem

Criar um histórico de vínculos de escala.

Exemplo:

FuncionarioEscala

* Id
* FuncionarioId
* EscalaId
* DataInicioVigencia
* DataFimVigencia (nullable)
* DataCriacao
* UsuarioCriacao

Sempre existirá apenas um vínculo ativo para uma determinada data.

Quando uma nova escala for criada:

* o vínculo anterior deverá receber DataFimVigencia = dia anterior ao início da nova vigência;
* será criado um novo vínculo com DataInicioVigencia igual à data informada;
* o novo vínculo permanecerá sem DataFimVigencia.

Toda consulta de escala deverá utilizar a escala vigente para a data consultada.

---

# Consulta da Escala

Sempre que o sistema precisar descobrir qual escala utilizar para determinado registro de ponto, deverá buscar a escala vigente naquela data.

Nunca utilizar apenas a "escala atual" do funcionário.

---

# Fluxo da Alteração

Ao clicar em alterar escala:

O usuário deverá informar:

* Nova escala
* Data de início da vigência

O botão não deverá salvar imediatamente.

O botão deverá executar uma simulação.

Exemplo:

"Simular Alteração"

---

# Simulação

O backend deverá analisar todos os registros existentes a partir da nova data de vigência.

Para cada registro deverá comparar:

* escala antiga
* nova escala
* jornada prevista anterior
* nova jornada prevista
* atrasos
* faltas
* horas extras
* folgas
* feriados
* banco de horas
* demais eventos existentes no sistema

O objetivo é descobrir quais registros podem sofrer impacto.

---

# Divergências

Somente registros impactados deverão ser considerados divergências.

Exemplos:

* uma falta pode deixar de existir porque o dia virou folga;
* um atraso pode diminuir ou desaparecer;
* uma hora extra pode deixar de existir;
* um dia anteriormente trabalhado pode passar a ser folga;
* uma folga pode virar dia útil;
* uma escala 12x36 pode alterar completamente os dias trabalhados.

---

# Tela de Revisão

Após a simulação deverá ser apresentada uma tela de revisão.

Caso não exista nenhuma divergência:

Apresentar um resumo contendo:

* funcionário
* escala atual
* nova escala
* data de vigência

Mensagem:

"Nenhuma divergência foi encontrada. Deseja confirmar a alteração?"

Botões:

* Cancelar
* Confirmar Alteração

Mesmo sem divergências a confirmação deve ser obrigatória.

---

Caso existam divergências:

Exibir uma tela de revisão contendo:

Resumo:

* funcionário
* escala atual
* nova escala
* data da vigência
* quantidade de registros analisados
* quantidade de registros impactados

---

# Visualização dos Registros

Não utilizar duas tabelas independentes.

Cada registro deverá ser apresentado individualmente em formato de comparação.

Exemplo conceitual:

ANTES

Escala:
08:00 às 17:00

Registro:
Falta

↓

NOVA ESCALA

Folga

↓

RESULTADO SUGERIDO

Folga

Outro exemplo:

ANTES

Entrada prevista:
08:00

Entrada realizada:
09:05

Atraso:
1h05

↓

NOVA ESCALA

Entrada prevista:
09:00

↓

RESULTADO

Novo atraso:
5 minutos

O usuário deve conseguir entender claramente:

* como era;
* como ficará a escala;
* qual será o resultado final após a alteração.

---

# Sugestões Automáticas

O sistema deverá sugerir automaticamente a melhor ação para cada divergência.

Exemplos:

* remover atraso;
* remover falta;
* recalcular hora extra;
* converter para folga;
* criar falta;
* manter registro existente.

As sugestões são apenas sugestões.

Nunca devem ser aplicadas automaticamente sem confirmação.

---

# Alteração Manual

Cada divergência deverá permitir edição manual.

O usuário poderá escolher entre:

* aplicar sugestão automática;
* manter o registro atual;
* alterar manualmente o resultado.

O sistema nunca deverá obrigar o usuário a aceitar a sugestão.

O usuário sempre terá a decisão final.

---

# Filtro

Adicionar um filtro na tela:

[x] Mostrar apenas divergências

Ao desmarcar:

Mostrar todos os registros analisados.

---

# Confirmação Final

Após a revisão:

Botões:

Cancelar

Confirmar Alteração

Somente após essa confirmação o sistema deverá:

* encerrar o vínculo antigo;
* criar o novo vínculo;
* aplicar as alterações escolhidas;
* recalcular apenas os registros necessários.

---

# Registros Antigos

O sistema NÃO deverá impedir alterações em registros antigos.

Mesmo que existam registros de meses anteriores ou já fechados.

Entretanto, sempre que isso ocorrer, exibir um aviso informativo semelhante a:

"Esta alteração afetará registros históricos. Certifique-se de que esta alteração está correta antes de continuar."

A decisão final permanece do usuário.

Nenhum bloqueio deverá ser implementado.

---

# Auditoria

Registrar:

* usuário responsável;
* data da alteração;
* escala antiga;
* nova escala;
* data da vigência;
* quantidade de registros alterados automaticamente;
* quantidade de registros alterados manualmente.

---

# Requisitos Técnicos

A implementação deve:

* preservar toda a lógica atual de cálculo de ponto;
* preservar regras existentes da escala 12x36;
* preservar regras de feriados;
* preservar banco de horas;
* preservar cálculo de horas extras;
* preservar geração automática de registros;
* preservar funcionamento dos relatórios.

Toda lógica existente deverá passar a utilizar a escala vigente na data do registro.

---

# Critérios de Aceitação

A implementação somente será considerada concluída quando:

✓ O histórico de escalas estiver funcionando.

✓ Alterar uma escala não modificar registros anteriores automaticamente.

✓ A consulta de qualquer registro utilizar a escala vigente naquela data.

✓ A simulação encontrar corretamente todas as divergências.

✓ A tela de revisão permitir visualizar "Antes → Nova Escala → Resultado".

✓ O usuário puder aceitar sugestões automáticas.

✓ O usuário puder editar manualmente qualquer divergência.

✓ A alteração somente ocorrer após confirmação final.

✓ Quando não existirem divergências, ainda existir confirmação antes da gravação.

✓ O sistema permitir alterações em registros antigos apenas exibindo um aviso, sem impedir a operação.

✓ Nenhuma funcionalidade existente do sistema deixar de funcionar.

---

# Validação Final

Antes de considerar a implementação concluída, validar:

* alteração para escala fixa;
* alteração para escala personalizada;
* alteração para escala 12x36;
* alteração envolvendo feriados;
* alteração envolvendo folgas;
* alteração envolvendo faltas;
* alteração envolvendo atrasos;
* alteração envolvendo horas extras;
* alteração sem nenhuma divergência;
* alteração com múltiplas divergências;
* alteração manual;
* alteração utilizando apenas sugestões automáticas;
* geração dos relatórios após alteração;
* geração automática de registros após alteração.

Nenhuma dessas funcionalidades poderá apresentar regressões.
