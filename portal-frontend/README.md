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

Crie um arquivo `.env` na raiz do projeto:

```
VITE_API_URL=http://localhost:5000/api
```

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

3. **Build automático:**
```bash
npm run build
```

O site estará disponível em: `https://seu-usuario.github.io/GestaoBandoDeHoras/`

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
