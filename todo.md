# Tarefas a Fazer

## 4.1 Atualização da Documentação

- [ ] **Swagger:** Revisar todos os comentários JSDoc (@swagger) nas rotas para garantir que descrevem corretamente os endpoints, parâmetros, corpos de requisição, respostas (incluindo schemas e códigos de erro) e segurança.
- [x] **README.md:** Atualizar o README.md com:
  - [x] Instruções detalhadas de setup (clonar, instalar deps, configurar .env).
  - [x] Lista completa de variáveis de ambiente necessárias.
  - [x] Comandos para rodar o servidor em dev, rodar testes, rodar build.
  - [x] Instruções para rodar migrações Prisma.
  - [x] Link para a documentação Swagger.
- [ ] **(Opcional) TypeDoc:** Gerar documentação HTML a partir dos comentários TSDoc no código fonte.

## 4.2 Preparação para Deploy Contínuo

- [x] **Scripts de Produção:** Garantir que package.json tenha scripts `build` (para compilar TS para JS) e `start` (para rodar o JS compilado).
- [x] **Dockerfile (se aplicável):** Se for usar contêineres, criar/revisar o Dockerfile para produção.
- [x] **Migrações:** Definir o processo para rodar migrações Prisma no ambiente de produção durante o deploy (`prisma migrate deploy`).
- [x] **Configuração de Ambiente:** Documentar como configurar as variáveis de ambiente na plataforma de hospedagem escolhida (Render, Fly.io, etc.) - *Coberto pela atualização do README.md*.
