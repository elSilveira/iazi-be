# Instruções para Deploy no Railway com Docker

Este documento fornece instruções para o deploy da API ServiConnect no Railway usando Docker.

## Arquivos Configurados para Deploy

Os seguintes arquivos foram configurados especificamente para o deploy no Railway:

- `Dockerfile` - Configuração do container Docker
- `railway.json` - Configuração específica para o Railway
- `railway-build.sh` - Script de build personalizado
- `healthcheck.sh` - Script para verificar a saúde da aplicação
- `Procfile` - Configuração para plataformas baseadas em Heroku
- `validate-docker-full.sh` - Script para validação completa da imagem Docker localmente
- `railway-test.sh` - Script para verificação rápida após deploy

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel do Railway:

- `DATABASE_URL` - URL de conexão com o banco de dados PostgreSQL
- `JWT_SECRET` - Chave secreta para tokens JWT
- `REFRESH_TOKEN_SECRET` - Chave secreta para tokens de atualização
- `NODE_ENV` - Ambiente (production)
- `PORT` - Porta da aplicação (configurada automaticamente pelo Railway)

## Instruções de Deploy

### Método 1: Deploy Direto do GitHub

1. No painel do Railway, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Selecione o repositório contendo a API
4. Railway detectará automaticamente o Dockerfile e utilizará ele para o build
5. Configure as variáveis de ambiente necessárias
6. A aplicação será construída e implantada automaticamente

### Método 2: Deploy Manual via CLI Railway

1. Instale a CLI do Railway: `npm install -g @railway/cli`
2. Faça login: `railway login`
3. Navegue até a pasta do projeto e execute:
   ```powershell
   railway init
   railway up
   ```
4. Configure as variáveis de ambiente pelo painel ou CLI
5. Verifique o status: `railway status`

### Método 3: Teste Local com Docker Compose

Para testar localmente antes do deploy:

1. Configure as variáveis de ambiente em um arquivo `.env`
2. Execute o Docker Compose:
   ```powershell
   docker-compose up -d
   ```
3. Verifique o status: `docker-compose ps`
4. Acesse a aplicação em: http://localhost:3002

## Validação Local da Imagem Docker

Antes de fazer o deploy, você pode validar a imagem Docker localmente:

```powershell
# Dê permissão de execução (Linux/Mac)
chmod +x validate-docker-full.sh

# Execute o script de validação
./validate-docker-full.sh
```

O script realiza as seguintes verificações:
- Constrói a imagem Docker
- Analisa o tamanho e número de camadas
- Inicia um container com a imagem
- Verifica logs por erros
- Testa o endpoint de saúde
- Verifica processos em execução
- Testa reinicialização do container

## Solucionando Problemas

### Erro no npm install

Se você encontrar erros durante o `npm install` no processo de build, isso pode ser devido a vários fatores:

1. **Incompatibilidade de Versão do Node.js**
   - Nosso Dockerfile utiliza Node.js 18, que é mais estável para este projeto

2. **Permissões**
   - O script `railway-build.sh` inclui comandos para limpar cache e usar flags específicas para instalação

3. **Módulos Nativos**
   - Incluímos os pacotes necessários para compilar módulos nativos: `python3`, `make`, `g++`

4. **Cliente Prisma**
   - Garantimos que `@prisma/client` seja gerado corretamente em cada build e startup

### Erro no Prisma Client

Se encontrar erros relacionados ao Prisma:

1. **Cliente Não Gerado**
   - Problema: `Cannot find module '@prisma/client'`
   - Solução: Verificamos que a geração do cliente Prisma ocorra nas etapas de build e startup
   - A diretiva `postinstall` no package.json garante que ele seja gerado após a instalação de dependências

2. **Problema na Migração**
   - Problema: `P1001: Can't reach database server`
   - Solução: Verifique a variável `DATABASE_URL` no painel do Railway
   - Se necessário, execute manualmente: `npx prisma migrate deploy`

3. **Incompatibilidade de Esquema**
   - Problema: `The table X does not exist in the current database`
   - Solução: Certifique-se de que o esquema Prisma esteja sincronizado com o banco de dados
   - Use `npx prisma db push` (desenvolvimento) ou `npx prisma migrate deploy` (produção)

### Erro no Docker Build

Problemas no build da imagem Docker:

1. **Timeout durante o build**
   - O Railway tem limite de tempo para builds
   - Solução: Otimizamos o Dockerfile para usar multi-stage builds e caching eficiente

2. **Tamanho da Imagem**
   - Problema: Imagem muito grande excedendo limites
   - Solução: Usamos Node Alpine e minimizamos dependências

3. **Falha no Healthcheck**
   - Problema: Aplicação não passa no healthcheck
   - Solução: Verifique se `/api/health` está respondendo corretamente
   - Use o script `railway-test.sh` para testar após o deploy

### Verificando a Saúde da Aplicação

Após o deploy, verifique se a aplicação está funcionando corretamente:

1. **Endpoint de Saúde**
   ```
   https://[seu-dominio-railway]/api/health
   ```
   Deve retornar: `{"status":"ok","timestamp":"...","uptime":123,"environment":"production"}`

2. **Verificação Automatizada**
   ```powershell
   ./railway-test.sh https://[seu-dominio-railway]
   ```

## Logs e Monitoramento

### Logs em Tempo Real

1. **Via Railway Dashboard**
   - No painel do Railway, navegue até sua aplicação e clique na aba "Logs"
   - Visualize logs em tempo real e filtre por tipo

2. **Via CLI Railway**
   ```powershell
   railway logs
   ```

### Monitoramento Avançado

Para monitoramento mais robusto, considere integrar com:

1. **Sentry**
   - Para rastreamento de erros e performance
   - Adicione o SDK do Sentry ao projeto

2. **DataDog ou New Relic**
   - Para monitoramento de infraestrutura e APM
   - Configure os agentes via variáveis de ambiente

3. **Uptime Robot ou Pingdom**
   - Para monitoramento de disponibilidade externo
   - Configure para verificar o endpoint `/api/health`

## Estratégia de Banco de Dados

### Migrações em Produção

Para garantir migrações seguras no Railway:

1. **Antes do Deploy**
   - Teste todas as migrações localmente

2. **Durante o Deploy**
   - Utilize o comando `npx prisma migrate deploy` no início do script de startup
   - Verifique se a variável `DATABASE_URL` aponta para o banco correto

3. **Monitoramento de Migrações**
   - Monitore os logs durante as migrações para identificar possíveis problemas

### Backup de Dados

O Railway não fornece backups automáticos por padrão. Considere:

1. **Backups Programados**
   - Configure jobs para backups regulares usando `pg_dump`

2. **Serviço PostgreSQL Gerenciado**
   - Considere usar uma solução como Supabase ou Railway PostgreSQL Add-on
   - Configure backups automáticos

## Estratégia de Deploy

### Zero Downtime Deploy

O Railway suporta zero downtime deploy:

1. **Health Checks**
   - A configuração de health check já está implementada em `railway.json`
   - O Railway aguardará a aplicação estar saudável antes de rotear tráfego

2. **Deploy Canário**
   - Considere realizar deploys canários com porcentagens de tráfego
   - Via Railway Dashboard: New Service -> Advanced -> Traffic Split

## Conclusão

Este guia de deploy fornece uma base sólida para implantar e manter a aplicação ServiConnect no Railway usando Docker. Para problemas adicionais, consulte a documentação oficial do Railway ou abra uma issue no repositório.
