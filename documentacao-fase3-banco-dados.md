# Documentação da Fase 3: Integração com Banco de Dados

Esta documentação detalha a implementação da Fase 3 do projeto ServiConnect, focada na integração do backend com um banco de dados relacional usando PostgreSQL e o ORM Prisma.

## 1. Escolha e Configuração do Banco de Dados e ORM

*   **Banco de Dados:** PostgreSQL foi escolhido devido à sua robustez, confiabilidade e bom suporte na comunidade Node.js.
*   **ORM:** Prisma foi selecionado por sua excelente integração com TypeScript, segurança de tipos, sistema de migração intuitivo e cliente gerado automaticamente.

### Configuração:

1.  **Instalação do PostgreSQL:** O PostgreSQL foi instalado no ambiente de desenvolvimento (`sudo apt-get install postgresql postgresql-contrib`).
2.  **Criação do Usuário e Banco de Dados:** Um usuário (`serviconnect_user`) e um banco de dados (`serviconnect_db`) foram criados no PostgreSQL com as permissões necessárias (`CREATEDB` para as migrações do Prisma).
    ```sql
    CREATE USER serviconnect_user WITH PASSWORD 'password';
    CREATE DATABASE serviconnect_db OWNER serviconnect_user;
    ALTER USER serviconnect_user WITH CREATEDB;
    ```
3.  **Instalação do Prisma:** As dependências do Prisma foram adicionadas ao projeto:
    ```bash
    npm install prisma --save-dev
    npm install @prisma/client
    ```
4.  **Inicialização do Prisma:** O Prisma foi inicializado no projeto:
    ```bash
    npx prisma init
    ```
    Isso criou a pasta `prisma` com o arquivo `schema.prisma` e o arquivo `.env`.
5.  **Configuração da Conexão:** O arquivo `.env` foi atualizado com a string de conexão correta para o banco de dados PostgreSQL local:
    ```dotenv
    DATABASE_URL="postgresql://serviconnect_user:password@localhost:5432/serviconnect_db?schema=public"
    ```
6.  **Configuração do Schema:** O arquivo `prisma/schema.prisma` foi configurado para usar o provider `postgresql` e carregar a URL do banco de dados do `.env`.

## 2. Definição dos Modelos/Entidades

O arquivo `prisma/schema.prisma` foi atualizado para definir os modelos de dados da aplicação, incluindo:

*   `User`: Informações do usuário (autenticação).
*   `Company`: Informações da empresa prestadora de serviços.
*   `Address`: Endereço da empresa (relação 1-para-1 com `Company`).
*   `Service`: Serviços oferecidos pela empresa.
*   `Professional`: Profissionais que trabalham na empresa.
*   `ProfessionalService`: Tabela de junção para o relacionamento N-para-N entre `Professional` e `Service`, permitindo preços específicos.
*   `Appointment`: Agendamentos realizados pelos usuários.
*   `Review`: Avaliações feitas pelos usuários sobre serviços, profissionais ou empresas.
*   `AppointmentStatus`: Enumeração para os status dos agendamentos.

Os relacionamentos entre os modelos foram definidos usando as diretivas do Prisma (`@relation`, `@id`, `@default`, `@unique`, `@updatedAt`, etc.) e regras de exclusão em cascata (`onDelete: Cascade`) foram aplicadas onde apropriado.

## 3. Configuração das Migrações

O sistema de migração do Prisma foi utilizado para criar e aplicar as alterações do esquema no banco de dados:

1.  **Criação da Migração Inicial:** Após definir os modelos no `schema.prisma`, a primeira migração foi criada:
    ```bash
    npx prisma migrate dev --name init
    ```
    Isso gerou um arquivo SQL na pasta `prisma/migrations` e aplicou as alterações ao banco de dados, criando todas as tabelas.
2.  **Geração do Prisma Client:** O comando `migrate dev` também executa `prisma generate` automaticamente, atualizando o cliente Prisma (`@prisma/client`) com base no schema atual.

## 4. Implementação dos Repositórios

Foi criada uma camada de repositório para abstrair o acesso direto ao Prisma Client e centralizar a lógica de consulta ao banco de dados. Os seguintes repositórios foram implementados na pasta `src/repositories`:

*   `userRepository.ts`
*   `companyRepository.ts`
*   `serviceRepository.ts`
*   `professionalRepository.ts`
*   `appointmentRepository.ts`
*   `reviewRepository.ts`

Cada repositório exporta um objeto com funções assíncronas que utilizam a instância singleton do `PrismaClient` (definida em `src/lib/prisma.ts`) para realizar operações CRUD e consultas específicas para sua respectiva entidade.

## 5. Refatoração dos Serviços (Controladores)

Os controladores existentes na pasta `src/controllers` foram refatorados para utilizar os repositórios em vez dos dados mockados:

*   **`authController.ts`:**
    *   A função `login` agora busca o usuário no banco de dados via `userRepository`.
    *   A validação de senha usa `bcrypt.compare` para comparar a senha fornecida com o hash armazenado.
    *   Uma nova função `register` foi adicionada, que usa `bcrypt.hash` para armazenar a senha e `userRepository.create` para criar o novo usuário.
*   **`serviceController.ts`, `companyController.ts`, `professionalController.ts`, `appointmentController.ts`, `reviewController.ts`:**
    *   Todas as funções (getAll, getById, create, update, delete) foram reescritas para usar os métodos correspondentes dos seus respectivos repositórios.
    *   Foi adicionado tratamento de erros básico, incluindo a verificação de erros específicos do Prisma (como `P2003` para falha de chave estrangeira ou `P2025` para registro não encontrado).
    *   A lógica para lidar com a criação/atualização de relações (ex: criar endereço ao criar empresa) foi indicada com comentários `// TODO:` para implementação futura, pois requerem lógica adicional ou transações Prisma.

## 6. Scripts de Seeding

Um script de seeding (`prisma/seed.ts`) foi criado para popular o banco de dados com dados iniciais para facilitar testes e desenvolvimento.

*   **Conteúdo:** O script cria usuários (com senhas hasheadas), uma empresa com endereço, profissionais, serviços, conecta profissionais a serviços, cria um agendamento e uma avaliação.
*   **Execução:**
    1.  O `package.json` foi atualizado para incluir o script `prisma:seed` e a configuração `prisma.seed`:
        ```json
        {
          "scripts": {
            "prisma:seed": "prisma db seed"
          },
          "prisma": {
            "seed": "ts-node prisma/seed.ts"
          }
        }
        ```
    2.  As dependências `ts-node` e `@types/node` foram instaladas.
    3.  O script pode ser executado com:
        ```bash
        npx prisma db seed
        ```
    *   **Observação:** O comando `prisma migrate reset --force` também executa o script de seed automaticamente após resetar e aplicar as migrações.

## 7. Testes

Os testes iniciais focaram na execução bem-sucedida das migrações e do script de seeding. Foram encontrados e resolvidos problemas comuns:

*   **Permissão `CREATEDB`:** O usuário do banco de dados precisou da permissão `CREATEDB` para que o Prisma pudesse criar o banco de dados shadow durante as migrações.
*   **Inicialização do Prisma Client no Seed:** O erro `@prisma/client did not initialize yet` foi resolvido ajustando a importação no `seed.ts` para usar o caminho relativo ao cliente gerado (`../src/generated/prisma`) ou garantindo que `prisma generate` fosse executado antes do seed.

Testes mais aprofundados das rotas da API com os dados populados pelo seed são recomendados como próximo passo.

## Conclusão da Fase 3

A integração com o banco de dados PostgreSQL usando Prisma foi concluída com sucesso. O backend agora utiliza um banco de dados real para persistência de dados, com um schema bem definido, migrações configuradas, uma camada de repositório implementada e serviços refatorados para usar essa nova camada. O script de seeding facilita a inicialização do ambiente de desenvolvimento com dados consistentes.
