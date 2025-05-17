# Correções para o Build Docker no Railway

Este documento resume as mudanças feitas para resolver o problema de falha no `npm install` durante o build do Docker no Railway.

## Mudanças Realizadas

### 1. Dependências Ajustadas

- Movido `bcrypt` de devDependencies para dependencies
  - Isso é essencial porque bcrypt é usado em produção para hashing de senhas

### 2. Configurações npm Otimizadas

- Criado arquivo `.npmrc` com configurações de resiliência para instalações npm
  - Aumentado timeout de rede
  - Configurado retries para falhas de rede
  - Otimizado para ambientes cloud

### 3. Scripts Docker Melhorados

- Otimizado `Dockerfile` com:
  - Estratégia de fallback para instalação de pacotes
  - Dependências de build necessárias (python3, make, g++, git)
  - Multi-stage build para menor tamanho de imagem

- Melhorado `railway-build.sh` com:
  - Tentativas múltiplas de instalação (npm ci → npm install → flags adicionais)
  - Melhor diagnóstico em caso de falha
  - Limpeza de cache npm

### 4. Healthcheck Aprimorado

- Aumentado timeout no healthcheck (de 5s para 10s)
- Melhorado script de healthcheck.sh com mais diagnósticos

### 5. Configuração do Railway

- Atualizado `railway.json` com:
  - Maior timeout para healthcheck
  - Configuração de retries para reinicialização

### 6. Ferramentas de Diagnóstico Adicionadas

- Criado `validate-docker-build.sh` para testar builds localmente
- Criado `check-dependencies.sh` para verificar dependências problemáticas
- Criado `railway-npm-fix.sh` para corrigir problemas específicos do npm
- Documentado soluções de problemas em `NPM-INSTALL-TROUBLESHOOTING.md`

## Como Testar

1. Execute `./check-dependencies.sh` para verificar se as dependências estão corretas
2. Execute `./validate-docker-build.sh` para testar o build do Docker localmente
3. Faça commit das alterações e push para o repositório
4. Deploy no Railway com `railway up`

## Monitoramento

Após o deploy, monitore:

1. Logs do build para verificar se a instalação npm está funcionando
2. Healthcheck para garantir que a aplicação está iniciando corretamente
3. Logs da aplicação para identificar possíveis problemas em runtime

Se encontrar problemas, consulte `NPM-INSTALL-TROUBLESHOOTING.md` para soluções adicionais.
