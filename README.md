# ServiConnect Backend

Este repositório contém o código-fonte do backend para o projeto ServiConnect, incluindo a integração com banco de dados implementada na Fase 3.

## Visão Geral

O ServiConnect Backend é uma API RESTful desenvolvida com Node.js e TypeScript, utilizando PostgreSQL e Prisma para persistência de dados. Ele fornece dados e funcionalidades para o frontend do ServiConnect.

## Tecnologias Utilizadas

- Node.js
- TypeScript
- Express
- PostgreSQL (Banco de Dados)
- Prisma (ORM)
- bcrypt (Hashing de Senha)
- CORS
- JWT (para autenticação)
- Swagger (para documentação da API)

## Como Executar Localmente

**Pré-requisitos:**
- Node.js e npm instalados - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- PostgreSQL instalado e rodando - [instalar PostgreSQL](https://www.postgresql.org/download/)

### Passos para Execução

```sh
# 1. Clone o repositório (se ainda não o fez)
# git clone <URL_DO_REPOSITORIO>

# 2. Navegue até o diretório do backend
cd serviconnect-backend

# 3. Instale as dependências
npm install

# 4. Configure o Banco de Dados PostgreSQL:
#    - Crie um usuário (ex: serviconnect_user) com senha (ex: password)
#    - Crie um banco de dados (ex: serviconnect_db) pertencente a esse usuário
#    - Conceda a permissão CREATEDB ao usuário (necessário para o Prisma Migrate)
#    Exemplo de comandos SQL (execute como superusuário do Postgres):
#    CREATE USER serviconnect_user WITH PASSWORD 'password';
#    CREATE DATABASE serviconnect_db OWNER serviconnect_user;
#    ALTER USER serviconnect_user WITH CREATEDB;

# 5. Configure as variáveis de ambiente:
#    - Copie o arquivo .env.example para .env (se existir) ou crie um arquivo .env
#    - Atualize a variável DATABASE_URL no arquivo .env com suas credenciais do PostgreSQL:
#      DATABASE_URL="postgresql://serviconnect_user:password@localhost:5432/serviconnect_db?schema=public"
#    - (Opcional) Defina uma JWT_SECRET no .env para maior segurança.

# 6. Aplique as migrações do banco de dados:
#    Este comando criará as tabelas no banco de dados com base no schema Prisma.
npx prisma migrate dev

# 7. (Opcional) Popule o banco de dados com dados iniciais:
npx prisma db seed

# 8. Inicie o servidor de desenvolvimento:
npm run dev

# Alternativamente, para produção (após build):
# npm run build
# npm start
```

O servidor estará disponível em `http://localhost:3001` por padrão.

## Estrutura do Projeto

- `prisma/`: Contém o schema do banco de dados (`schema.prisma`), migrações e script de seed.
- `src/controllers`: Lógica de negócios para cada entidade (autenticação, serviços, empresas, etc.).
- `src/repositories`: Camada de acesso aos dados usando Prisma Client.
- `src/routes`: Definição de endpoints da API.
- `src/lib`: Utilitários, como a instância singleton do Prisma Client (`prisma.ts`).
- `src/generated/prisma`: Cliente Prisma gerado automaticamente.
- `src/models`: Definições de tipos TypeScript (podem ser removidas/ajustadas pois o Prisma gera tipos).
- `src/middleware`: Componentes de middleware (preparado para expansão futura).
- `src/index.ts`: Ponto de entrada da aplicação.
- `src/swagger.ts`: Configuração da documentação Swagger.

## Endpoints da API

Consulte a documentação Swagger para a lista completa e detalhada dos endpoints.

### Principais Endpoints:

- **Autenticação:**
  - `POST /api/auth/login`: Autenticação de usuários.
  - `POST /api/auth/register`: Registro de novos usuários.
- **Empresas:**
  - `GET /api/companies`: Lista todas as empresas.
  - `GET /api/companies/:id`: Obtém detalhes de uma empresa.
  - `POST /api/companies`: Cria uma nova empresa.
  - `PUT /api/companies/:id`: Atualiza uma empresa.
  - `DELETE /api/companies/:id`: Exclui uma empresa.
- **Serviços:**
  - `GET /api/services`: Lista todos os serviços (pode filtrar por `companyId`).
  - `GET /api/services/:id`: Obtém detalhes de um serviço.
  - `POST /api/services`: Cria um novo serviço.
  - `PUT /api/services/:id`: Atualiza um serviço.
  - `DELETE /api/services/:id`: Exclui um serviço.
- **Profissionais:**
  - `GET /api/professionals`: Lista todos os profissionais (pode filtrar por `companyId`).
  - `GET /api/professionals/:id`: Obtém detalhes de um profissional.
  - `POST /api/professionals`: Cria um novo profissional.
  - `PUT /api/professionals/:id`: Atualiza um profissional.
  - `DELETE /api/professionals/:id`: Exclui um profissional.
- **Agendamentos:**
  - `GET /api/appointments`: Lista agendamentos (requer filtro `userId` ou `professionalId`).
  - `GET /api/appointments/:id`: Obtém detalhes de um agendamento.
  - `POST /api/appointments`: Cria um novo agendamento.
  - `PUT /api/appointments/:id/status`: Atualiza o status de um agendamento.
  - `DELETE /api/appointments/:id`: Exclui um agendamento.
- **Avaliações:**
  - `GET /api/reviews`: Lista avaliações (requer filtro `serviceId`, `professionalId` ou `companyId`).
  - `GET /api/reviews/:id`: Obtém detalhes de uma avaliação.
  - `POST /api/reviews`: Cria uma nova avaliação.
  - `PUT /api/reviews/:id`: Atualiza uma avaliação.
  - `DELETE /api/reviews/:id`: Exclui uma avaliação.

## Documentação da API

A documentação da API está disponível através do Swagger UI em `http://localhost:3001/api-docs` quando o servidor está em execução.

## Próximos Passos (Sugestões)

- Implementar lógica para lidar com relações em `create`/`update` (ex: criar endereço junto com empresa, conectar serviços a profissionais).
- Implementar lógica para atualizar médias de avaliação (`rating`) nas entidades relacionadas após criar/atualizar/deletar `Review`.
- Adicionar validação de entrada mais robusta (ex: usando Zod).
- Implementar testes automatizados (unitários, integração, e2e).
- Refinar tratamento de erros.
- Implementar paginação para endpoints de listagem.
- Configurar CI/CD.

## Integração com Frontend

Para executar o projeto completo, você também precisará configurar e executar o frontend. Consulte o README do repositório frontend para obter instruções detalhadas.

---
*Este README foi atualizado para refletir a integração com banco de dados da Fase 3.*




## Notas sobre a Validação e Testes (Pós-Fase 3)

Durante a validação do código após a implementação da Fase 3 (Integração com Banco de Dados), foram encontrados alguns erros persistentes de tipagem no arquivo `src/routes/authRoutes.ts` relacionados às assinaturas das funções de callback do Express. Após tentativas de correção, optou-se por suprimir esses erros específicos usando comentários `// @ts-ignore` para permitir a compilação e execução do servidor. Esta é uma solução temporária e pode ser revisitada no futuro.

Além disso, ao tentar acessar a documentação Swagger UI (`/api-docs`) através do domínio público exposto pelo ambiente de desenvolvimento, foram encontrados erros de conexão (`ERR_CONNECTION_RESET` e `ERR_EMPTY_RESPONSE`). No entanto, a interface do Swagger foi verificada e está funcionando corretamente quando acessada localmente (`http://localhost:3001/api-docs`) dentro do ambiente sandbox. Isso sugere que o problema de acesso externo pode estar relacionado à camada de proxy do ambiente e não à configuração do servidor ou do Swagger em si.



## Testes

O projeto utiliza Jest para testes unitários e de integração.

### Executando Todos os Testes

Para executar todos os conjuntos de testes configurados no `package.json`:

```sh
npm test
```

### Executando Testes Específicos

Você pode executar um arquivo de teste específico usando o seguinte comando:

```sh
# Exemplo para testes unitários do controlador de autenticação
npm test -- src/__tests__/authController.test.ts

# Exemplo para testes de integração de agendamento
npm test -- src/__tests__/appointment.integration.test.ts
```

Alternativamente, você pode usar o `npx jest` diretamente:

```sh
npx jest src/__tests__/authController.test.ts
```

### Cobertura de Testes

Após a execução dos testes, um relatório de cobertura é gerado na pasta `coverage/`. Você pode abrir o arquivo `coverage/lcov-report/index.html` em um navegador para visualizar o relatório detalhado.

