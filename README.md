# ServiConnect Backend

Este repositório contém o código-fonte do backend para o projeto ServiConnect, desenvolvido como parte da Fase 2: Teste de Integração Inicial.

## Visão Geral

O ServiConnect Backend é uma API RESTful desenvolvida com Node.js e TypeScript, projetada para fornecer dados e funcionalidades para o frontend do ServiConnect.

## Tecnologias Utilizadas

- Node.js
- TypeScript
- Express
- CORS
- JWT (para autenticação)
- Swagger (para documentação da API)

## Como Executar Localmente

**Pré-requisitos:**
- Node.js e npm instalados - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Passos para Execução

```sh
# 1. Clone o repositório (se ainda não o fez)
# git clone <URL_DO_REPOSITORIO>

# 2. Navegue até o diretório do backend
cd serviconnect-backend

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev

# Alternativamente, você pode usar ts-node diretamente
npx ts-node src/index.ts
```

O servidor estará disponível em `http://localhost:3001` por padrão.

**Observação:** Atualmente, o backend pode apresentar erros de compilação TypeScript relacionados às rotas. Estes erros estão documentados e precisam ser resolvidos em uma próxima fase do desenvolvimento.

## Estrutura do Projeto

- `src/models`: Definições de tipos para User, Service e Company
- `src/controllers`: Lógica de negócios para autenticação, serviços e empresas
- `src/routes`: Definição de endpoints da API
- `src/middleware`: Componentes de middleware (preparado para expansão futura)
- `src/index.ts`: Ponto de entrada da aplicação
- `src/swagger.ts`: Configuração da documentação Swagger

## Endpoints da API

### Autenticação
- `POST /api/auth/login`: Autenticação de usuários

### Serviços
- `GET /api/services`: Lista todos os serviços
- `GET /api/services/:id`: Obtém detalhes de um serviço específico

### Empresas
- `GET /api/companies`: Lista todas as empresas
- `GET /api/companies/:id`: Obtém detalhes de uma empresa específica

## Documentação da API

A documentação da API está disponível através do Swagger UI em `http://localhost:3001/api-docs` quando o servidor está em execução.

## Próximos Passos

- Resolver problemas de tipagem TypeScript
- Expandir endpoints da API
- Implementar autenticação completa
- Melhorar tratamento de erros
- Adicionar testes automatizados

## Integração com Frontend

Para executar o projeto completo, você também precisará configurar e executar o frontend. Consulte o README do repositório frontend para obter instruções detalhadas.

---
*Este README foi criado para facilitar a execução local do backend do ServiConnect.*
