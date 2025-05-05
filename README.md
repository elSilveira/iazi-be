# ServiConnect Backend

Este repositório contém o código-fonte do backend para o projeto ServiConnect.

## Visão Geral

O ServiConnect Backend é uma API RESTful desenvolvida com Node.js e TypeScript, utilizando PostgreSQL e Prisma para persistência de dados. Ele fornece dados e funcionalidades para o frontend do ServiConnect.

## Tecnologias Utilizadas

- Node.js (v20 ou superior recomendado)
- TypeScript
- Express
- PostgreSQL (Banco de Dados)
- Prisma (ORM)
- bcrypt (Hashing de Senha)
- JWT (Autenticação)
- Winston (Logging)
- Swagger (Documentação da API)
- Jest (Testes)
- date-fns (Manipulação de datas)
- cors, helmet, express-rate-limit (Segurança e Middlewares)

## Configuração do Ambiente de Desenvolvimento

**Pré-requisitos:**

*   **Node.js e npm:** Instale usando [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recomendado) ou pelo site oficial. Versão 20 ou superior é preferível.
*   **PostgreSQL:** Instale e garanta que o serviço esteja rodando. [Instalar PostgreSQL](https://www.postgresql.org/download/).
*   **Git:** Necessário para clonar o repositório.

**Passos Detalhados:**

1.  **Clonar o Repositório:**
    ```bash
    git clone https://github.com/elSilveira/iazi-be.git
    cd iazi-be
    ```

2.  **Instalar Dependências:**
    ```bash
    npm install
    ```

3.  **Configurar Banco de Dados PostgreSQL:**
    *   Crie um usuário (ex: `serviconnect_user`) com uma senha segura (ex: `your_strong_password`).
    *   Crie um banco de dados (ex: `serviconnect_db`) pertencente a esse usuário.
    *   Conceda a permissão `CREATEDB` ao usuário (necessário para o Prisma Migrate criar/gerenciar o banco de testes).

    *Exemplo de comandos SQL (execute como superusuário do Postgres, como `postgres`):*
    ```sql
    CREATE USER serviconnect_user WITH PASSWORD 'your_strong_password';
    CREATE DATABASE serviconnect_db OWNER serviconnect_user;
    ALTER USER serviconnect_user WITH CREATEDB;
    ```

4.  **Configurar Variáveis de Ambiente:**
    *   Copie o arquivo `.env.example` (se existir) para `.env` ou crie um novo arquivo `.env` na raiz do projeto.
    *   Atualize as variáveis no arquivo `.env`:

        ```dotenv
        # URL de Conexão com o Banco de Dados PostgreSQL
        # Formato: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
        DATABASE_URL="postgresql://serviconnect_user:your_strong_password@localhost:5432/serviconnect_db?schema=public"

        # Segredo para assinatura dos tokens JWT (use um valor longo e aleatório)
        JWT_SECRET="your_very_strong_and_random_jwt_secret"

        # Duração do token de acesso (ex: 15m, 1h, 1d)
        JWT_ACCESS_EXPIRATION="15m"

        # Duração do token de atualização (ex: 7d, 30d)
        JWT_REFRESH_EXPIRATION="7d"

        # Porta em que o servidor irá rodar
        PORT=3002

        # Ambiente (development, production, test)
        NODE_ENV=development
        ```

5.  **Gerar Cliente Prisma:**
    Este comando lê o `schema.prisma` e gera o cliente TypeScript para interagir com o banco.
    ```bash
    npx prisma generate
    ```

6.  **Executar Migrações Prisma:**
    Este comando aplica as migrações pendentes ao banco de dados, criando ou atualizando as tabelas conforme definido no `schema.prisma`.
    ```bash
    npx prisma migrate dev
    ```
    *Nota: O comando `migrate dev` também pode criar o banco de dados se ele não existir (requer permissão `CREATEDB` para o usuário) e aplica as migrações.*

7.  **(Opcional) Popular Banco com Dados Iniciais (Seed):**
    Se houver um script de seed configurado (`prisma/seed.ts`), execute:
    ```bash
    npx prisma db seed
    ```

## Comandos Úteis

*   **Iniciar Servidor (Desenvolvimento):**
    Roda o servidor com `nodemon` para recarregamento automático em caso de alterações.
    ```bash
    npm run dev
    ```
    O servidor estará disponível em `http://localhost:3002` (ou a porta definida em `PORT`).

*   **Compilar para Produção (Build):**
    Compila o código TypeScript para JavaScript no diretório `dist/`.
    ```bash
    npm run build
    ```

*   **Iniciar Servidor (Produção):**
    Roda o servidor a partir do código JavaScript compilado. Requer execução prévia do `npm run build`.
    ```bash
    npm start
    ```

*   **Executar Todos os Testes:**
    ```bash
    npm test
    ```

*   **Executar Testes Específicos:**
    ```bash
    # Exemplo: Testes unitários do authController
    npm test -- src/__tests__/authController.test.ts
    # Ou usando npx jest
    npx jest src/__tests__/authController.test.ts
    ```

*   **Gerenciar Migrações Prisma:**
    ```bash
    # Criar uma nova migração após alterações no schema.prisma
    npx prisma migrate dev --name your_migration_name

    # Aplicar migrações pendentes em produção (NÃO use 'dev' em produção)
    npx prisma migrate deploy

    # Resetar o banco de dados (CUIDADO: apaga todos os dados)
    npx prisma migrate reset
    ```

*   **Abrir Prisma Studio:**
    Interface gráfica para visualizar e manipular os dados no banco.
    ```bash
    npx prisma studio
    ```

## Estrutura do Projeto

- `prisma/`: Contém o `schema.prisma`, diretório `migrations/` e `seed.ts`.
- `src/`: Código-fonte da aplicação.
  - `controllers/`: Lógica de requisição/resposta e orquestração.
  - `repositories/`: Camada de acesso aos dados usando Prisma Client.
  - `services/`: Lógica de negócios reutilizável.
  - `routes/`: Definição dos endpoints da API e comentários Swagger.
  - `middlewares/`: Middlewares do Express (autenticação, validação, erro, logging).
  - `validators/`: Regras de validação de entrada (usando `express-validator`).
  - `utils/`: Funções utilitárias (ex: logger, cache, prismaClient).
  - `lib/`: Bibliotecas ou configurações reutilizáveis (ex: instância do Prisma).
  - `types/`: Definições de tipos TypeScript personalizadas.
  - `__tests__/`: Testes unitários e de integração.
  - `index.ts`: Ponto de entrada da aplicação Express.
  - `swaggerConfig.ts`: Configuração base do Swagger JSDoc.
- `logs/`: Arquivos de log gerados pelo Winston (ex: `error.log`).
- `coverage/`: Relatórios de cobertura de testes gerados pelo Jest.
- `dist/`: Código JavaScript compilado para produção.
- `.env`: Arquivo de variáveis de ambiente (NÃO versionar).
- `package.json`, `tsconfig.json`, etc.: Arquivos de configuração do projeto.

## Documentação da API (Swagger)

A documentação interativa da API está disponível através do Swagger UI.

**Acesse:** `http://localhost:3002/api-docs` (quando o servidor `npm run dev` estiver em execução).

## Próximos Passos (Sugestões)

- Implementar lógica para atualizar médias de avaliação (`rating`) nas entidades relacionadas após criar/atualizar/deletar `Review`.
- Adicionar validação de entrada mais robusta (ex: usando Zod em vez de `express-validator`).
- Expandir a cobertura de testes automatizados (unitários, integração, e2e).
- Refinar tratamento de erros específicos da aplicação.
- Implementar paginação consistente para todos os endpoints de listagem.
- Configurar CI/CD para automação de build, testes e deploy.
- Considerar um Dockerfile para facilitar o deploy em contêineres.

## Integração com Frontend

Para executar o projeto completo, você também precisará configurar e executar o frontend. Consulte o README do repositório frontend para obter instruções detalhadas.

---
*Este README foi atualizado para refletir as melhorias de documentação e preparação para deploy da Fase 4.*




## Deploy em Produção

Esta seção detalha os passos e considerações para fazer o deploy desta aplicação em um ambiente de produção.

### 1. Build da Aplicação

Antes do deploy, você precisa compilar o código TypeScript para JavaScript:

```bash
npm run build
```
Este comando criará o diretório `dist/` com o código JavaScript pronto para ser executado.

### 2. Migrações Prisma em Produção

**NÃO use `prisma migrate dev` em produção.** Este comando é destinado apenas ao desenvolvimento e pode causar perda de dados.

Para aplicar migrações em um ambiente de produção, use o comando `prisma migrate deploy`. Este comando aplica apenas as migrações pendentes que já foram geradas durante o desenvolvimento (com `migrate dev`) e estão registradas no diretório `prisma/migrations/`.

**Processo recomendado:**

1.  **Durante o processo de deploy (CI/CD ou manual):** Após o build e antes de iniciar a nova versão da aplicação, execute:
    ```bash
    npx prisma migrate deploy
    ```
2.  **Garantias:**
    *   Certifique-se de que a variável de ambiente `DATABASE_URL` esteja configurada corretamente no ambiente de produção.
    *   O comando `migrate deploy` não tentará criar ou resetar o banco de dados.
    *   Ele apenas aplica migrações que ainda não foram aplicadas no banco de produção.

### 3. Configuração de Variáveis de Ambiente

As variáveis de ambiente são cruciais para a configuração em produção. **NUNCA** versione o arquivo `.env` de produção no Git.

**Variáveis Necessárias:**

*   `DATABASE_URL`: A string de conexão completa para o seu banco de dados PostgreSQL de produção.
*   `JWT_SECRET`: Um segredo longo, forte e aleatório para a assinatura dos tokens JWT. Use um gerador de segredos.
*   `JWT_ACCESS_EXPIRATION`: Duração do token de acesso (ex: `15m`).
*   `JWT_REFRESH_EXPIRATION`: Duração do token de refresh (ex: `30d`).
*   `PORT`: A porta em que a aplicação deve escutar (geralmente fornecida pela plataforma de hospedagem, ex: `8080`, `10000`).
*   `NODE_ENV`: Defina como `production` para otimizações e segurança.

**Como Configurar (Exemplos):**

*   **Plataformas como Render, Fly.io, Heroku, Vercel:**
    *   Utilize a interface web da plataforma para definir as variáveis de ambiente. Procure por seções como "Environment Variables", "Secrets" ou "Config Vars".
    *   Copie e cole os nomes e valores das variáveis listadas acima.
*   **Servidores VPS ou Bare Metal:**
    *   **Usando `.env` (Menos recomendado para produção):** Crie um arquivo `.env` no servidor e use uma biblioteca como `dotenv` (já inclusa) para carregá-las. Garanta que este arquivo não seja acessível publicamente.
    *   **Variáveis de Ambiente do Sistema:** Defina as variáveis diretamente no ambiente do sistema operacional ou através de ferramentas de gerenciamento de configuração (Ansible, Chef, Puppet).
    *   **Systemd / Gerenciadores de Processo:** Configure as variáveis de ambiente no arquivo de serviço do systemd ou similar (pm2, nodemon em modo produção).
*   **Docker:**
    *   Passe as variáveis ao executar o contêiner usando a flag `-e` ou um arquivo `env-file`:
        ```bash
        docker run -p 3002:3002 \
          -e DATABASE_URL="..." \
          -e JWT_SECRET="..." \
          -e NODE_ENV=production \
          your-image-name
        ```
    *   Em orquestradores como Kubernetes, use ConfigMaps ou Secrets.

### 4. Iniciando a Aplicação

Após o build, migrações e configuração das variáveis, inicie a aplicação usando o script `start`:

```bash
npm start
```
Este comando executará `node dist/index.js`.

Se estiver usando Docker, o `CMD` no `Dockerfile` cuidará disso.

