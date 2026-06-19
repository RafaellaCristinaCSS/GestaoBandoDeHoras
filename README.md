# Gestão Banco de Horas

Sistema para gestão de funcionários, cargos, escalas, registro de ponto, férias e relatórios de horas.

O repositório está organizado em dois projetos principais:

- [Portal](Portal) - backend em ASP.NET Core Web API
- [portal-frontend](portal-frontend) - frontend em React + TypeScript + Vite

## Visão Geral

O objetivo do sistema é centralizar o controle de jornada e de banco de horas, permitindo:

- cadastrar funcionários e cargos
- criar escalas de trabalho e vincular escalas aos funcionários
- registrar ponto com apoio de regras automáticas de cálculo
- lançar férias e ausências relacionadas
- gerar relatórios mensais e exportação para Excel

O backend expõe a API REST e persiste os dados em PostgreSQL. O frontend consome essa API e fornece a interface de operação.

## Stack

### Backend

- ASP.NET Core 8
- Entity Framework Core
- PostgreSQL com Npgsql
- JWT Bearer Authentication
- Swagger / OpenAPI

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query
- Axios
- React Hook Form + Zod
- XLSX para exportação de planilhas

## Estrutura do Repositório

```text
.
├── Portal/                 # API backend
├── portal-frontend/        # Aplicação web
├── Portal.slnx             # Solução principal
├── instrucoes.md           # Anotações internas do projeto
├── melhorias.md           # Lista de melhorias e pendências
└── table.csv               # Base auxiliar de dados
```

## Módulos do Sistema

### Funcionários

- cadastro, edição, listagem e exclusão
- vínculo com cargo
- vínculo com escala

### Cargos

- cadastro e listagem de cargos
- cargo mantido em tabela própria, sem enum local na interface

### Escalas

- cadastro de escalas com detalhes por dia/período
- suporte a escalas fixas e personalizadas
- suporte a escala 12x36

### Funcionário x Escala

- associação de uma ou mais escalas ao funcionário
- consulta da escala atual ativa do funcionário

### Registro de Ponto

- listagem e edição de registros por funcionário, mês e ano
- filtro por intervalo de datas
- suporte a lançamentos manuais e correções retroativas
- suporte a status como feriado, folga, falta, atestado e outros eventos operacionais

### Férias

- cadastro, edição, listagem e exclusão de períodos de férias

### Relatórios

- resumo mensal por funcionário
- exportação em Excel
- consolidação das horas planejadas, horas cumpridas, faltas, atrasos e horas extras

## Regras de Negócio Importantes

- O fechamento mensal do ponto usa a janela do dia 21 do mês anterior até o dia 20 do mês informado.
- O cadastro de cargos é persistido em tabela própria e consumido pela API `/api/cargos`.
- O status de feriado no ponto pode impactar o cálculo do relatório, considerando horas planejadas como zero por padrão.
- A escala 12x36 usa a data de início do vínculo como referência para alternância.
- O endpoint de consulta de registro de ponto pode gerar registros faltantes automaticamente durante a leitura.
- Existe suporte a correção retroativa de registros de escala 12x36 quando necessário.

## Backend

### Tecnologias e comportamento

- API REST em ASP.NET Core 8
- autenticação JWT
- CORS configurado para frontend local, GitHub Pages e Railway
- banco PostgreSQL com migrations do EF Core
- aplicação executa `Database.Migrate()` na inicialização
- documentação Swagger disponível na raiz da API

### Principais rotas da API

#### Cargos

- `GET /api/cargos`
- `POST /api/cargos`

#### Funcionários

- `GET /api/funcionarios`
- `GET /api/funcionarios/{id}`
- `POST /api/funcionarios`
- `PUT /api/funcionarios/{id}`
- `DELETE /api/funcionarios/{id}`

#### Escalas

- `GET /api/escalas`
- `GET /api/escalas/{id}`
- `POST /api/escalas`
- `PUT /api/escalas/{id}`
- `DELETE /api/escalas/{id}`
- `POST /api/escalas/{escalaId}/detalhes`
- `PUT /api/escalas/detalhes/{detalheId}`
- `DELETE /api/escalas/detalhes/{detalheId}`

#### Vínculo Funcionário x Escala

- `GET /api/funcionario-escalas/funcionario/{funcionarioId}`
- `GET /api/funcionario-escalas/funcionario/{funcionarioId}/atual`
- `POST /api/funcionario-escalas`
- `DELETE /api/funcionario-escalas/{id}`

#### Registro de Ponto

- `GET /api/registro-ponto`
- `GET /api/registro-ponto/{id}`
- `POST /api/registro-ponto`
- `PUT /api/registro-ponto/{id}`
- `DELETE /api/registro-ponto/{id}`
- `POST /api/registro-ponto/retroativo-doze36`

#### Férias

- `GET /api/ferias`
- `GET /api/ferias/{id}`
- `POST /api/ferias`
- `PUT /api/ferias/{id}`
- `DELETE /api/ferias/{id}`

### Configuração do Backend

Arquivo principal: [Portal/Program.cs](Portal/Program.cs)

Variáveis de ambiente esperadas:

```text
Jwt__Key=uma-chave-grande-e-secreta
Jwt__Issuer=Portal.Production
Jwt__Audience=Portal.Production
ConnectionStrings__DefaultConnection=Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
```

Também é possível configurar o banco via `DATABASE_URL` no formato PostgreSQL.

### Executar o backend

```bash
cd Portal
dotnet restore
dotnet run
```

Por padrão, a API sobe com Swagger habilitado e redireciona a raiz para a documentação.

## Frontend

O frontend foi criado com Vite e consome a API do backend.

### Arquivo de referência

Leia também: [portal-frontend/README.md](portal-frontend/README.md)

### Scripts principais

```bash
cd portal-frontend
npm install
npm run dev
npm run build
npm run preview
```

### Variáveis de ambiente do frontend

```text
VITE_API_URL=http://localhost:5264/api
VITE_API_URL_PROD=https://gestaobandodehoras-production.up.railway.app/api
```

Use `.env.development.local` para desenvolvimento local e `.env.production` para builds de produção.

## Como Rodar Localmente

1. Inicie o backend em uma porta disponível.
2. Configure `VITE_API_URL` no frontend apontando para a API local.
3. Instale e execute o frontend.
4. Acesse a aplicação web e faça os testes com dados reais ou de homologação.

Exemplo de fluxo:

```bash
cd Portal
dotnet run

cd ../portal-frontend
npm install
npm run dev
```

## Deploy

### Backend

O backend foi preparado para ambientes com PostgreSQL e suporta configuração por variáveis de ambiente. Em produção, ajuste:

- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `ConnectionStrings__DefaultConnection` ou `DATABASE_URL`

### Frontend

O frontend possui configuração para GitHub Pages via `homepage` e script de deploy com `gh-pages`.

```bash
cd portal-frontend
npm run build
npm run deploy
```

## Observações de Uso

- O relatório mensal segue a janela de fechamento operacional do sistema, não o mês civil inteiro.
- O backend aplica migrations automaticamente na inicialização.
- O Swagger é uma boa referência para validar a API em ambiente local.

## Próximas Melhorias

As melhorias planejadas estão registradas em [melhorias.md](melhorias.md).

## Licença

Projeto interno para gestão de banco de horas. Ajuste esta seção se houver uma licença formal definida.