# Sistema de Gestão de Funcionários - Frontend

Frontend em React + TypeScript + Vite para o sistema de gestão de funcionários, registro de ponto, escalas, férias e relatórios.

## Características

- ✅ **Tela de Funcionários** - CRUD completo com modal
- ✅ **Tela de Escalas** - Definição de horários de trabalho por dia da semana
- ✅ **Tela de Registro de Ponto** - Tabela com edição inline de horários
- ✅ **Tela de Férias** - Cadastro de períodos de férias
- ✅ **Tela de Relatórios** - Resumo mensal e exportação em Excel
- ✅ **Layout Responsivo** - Sidebar + Header com navegação
- ✅ **Toasts de Notificação** - Feedback de ações
- ✅ **Validação de Formulários** - Com Zod + React Hook Form

## Stack Técnico

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching & caching
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form validation
- **XLSX** - Excel export
- **Lucide React** - Icons

## Setup Inicial

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview build
npm run preview
```

## Variáveis de Ambiente

Desenvolvimento local:

```
VITE_API_URL=http://localhost:5264/api
```

Produção:

```
VITE_API_URL_PROD=https://gestaobandodehoras-production.up.railway.app/api
```

Use `.env.development.local` para desenvolvimento local e `.env.production` para sobrescrever a URL da API em builds de produção.

## Deploy no GitHub Pages

O projeto está configurado para ser deployado no GitHub Pages.

1. **Fazer push para GitHub:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Configurar GitHub Pages:**
   - Vá para Settings > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

3. **Build para produção:**
```bash
npm run build
```

Antes do deploy, confirme que o build gerou a URL da API de produção e não `localhost`.

O site estará disponível em: `https://seu-usuario.github.io/GestaoBandoDeHoras/`

## Backend em Produção

No backend, configure estas variáveis de ambiente na hospedagem:

```text
Jwt__Key=uma-chave-grande-e-secreta
Jwt__Issuer=Portal.Production
Jwt__Audience=Portal.Production
```

Banco de dados, use uma destas opções:

```text
ConnectionStrings__DefaultConnection=Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
```

ou

```text
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```

O backend aplica as migrations ao iniciar, então a conexão do banco precisa estar correta antes do primeiro deploy.

## Estrutura de Pastas

```
src/
├── components/        # Componentes reutilizáveis
├── pages/            # Páginas/Telas da aplicação
├── services/         # Serviços de API (Axios)
├── types/            # Types e DTOs TypeScript
├── utils/            # Funções utilitárias
├── hooks/            # Custom React hooks
├── layouts/          # Layouts (Sidebar, Header, MainLayout)
├── routes/           # Configuração de rotas
├── App.tsx           # Componente raiz
└── main.tsx          # Entry point
```

## APIs Esperadas

A aplicação espera uma API REST nos seguintes endpoints:

### Funcionários
- `GET /funcionarios`
- `POST /funcionarios`
- `PUT /funcionarios/{id}`
- `DELETE /funcionarios/{id}`

### Escalas
- `GET /escalas`
- `GET /escalas/funcionario/{id}`
- `POST /escalas`
- `PUT /escalas/{id}`
- `DELETE /escalas/{id}`

### Registro de Ponto
- `GET /registro-ponto?funcionarioId=X&mes=X&ano=X`
- `POST /registro-ponto`
- `PUT /registro-ponto/{id}`
- `DELETE /registro-ponto/{id}`

### Férias
- `GET /ferias`
- `POST /ferias`
- `PUT /ferias/{id}`
- `DELETE /ferias/{id}`

### Relatórios
- `GET /relatorios/resumo?funcionarioId=X&mes=X&ano=X`
- `GET /relatorios/excel?funcionarioId=X&mes=X&ano=X`

## Funcionalidades Principais

### Página de Funcionários
- Listar todos os funcionários
- Criar novo funcionário (modal)
- Editar funcionário (modal)
- Deletar com confirmação
- Status de ativo/inativo

### Página de Escalas
- Selecionar funcionário
- Definir dias da semana
- Horários de entrada/saída
- Marcar folgas
- CRUD completo

### Página de Registro de Ponto
- Selecionar funcionário, mês e ano
- Tabela com todos os dias do mês
- **Edição inline** de horários
- Checkbox de presença
- Status automático (Presente, Falta, Folga, Atrasado)
- Campo de observações

### Página de Férias
- Cadastro por funcionário
- Data inicial e final
- Observações opcionais
- CRUD completo

### Página de Relatórios
- Filtrar por funcionário, mês e ano
- Exibir resumo:
  - Dias presentes
  - Faltas
  - Folgas
  - Horas trabalhadas
  - Horas extras
- **Exportar em Excel** com formatação

## Autor

Desenvolvido para o sistema de Gestão de Banda de Horas.
