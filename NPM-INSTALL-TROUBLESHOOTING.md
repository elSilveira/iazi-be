# Troubleshooting npm Install Issues in Docker

Este documento fornece soluções para problemas comuns de instalação de dependências npm durante o build de containers Docker.

## Problemas Comuns e Soluções

### 1. Falha no npm install (Código de saída 1)

**Problema**: 
```
process "/bin/sh -c npm install" did not complete successfully: exit code: 1
```

**Soluções**:

1. **Dependências nativas que requerem compilação**:
   - Certifique-se de que todas as dependências de build estejam instaladas:
   ```dockerfile
   RUN apk add --no-cache python3 make g++ git
   ```

2. **Falhas de rede**:
   - Configure o npm para ser mais resiliente com timeouts e retries:
   ```dockerfile
   RUN npm config set network-timeout 300000 && \
       npm config set fetch-retries 3
   ```

3. **Incompatibilidade de dependências**:
   - Tente usar flags que ignoram problemas de peer dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Cache npm corrompido**:
   - Limpe o cache antes da instalação:
   ```bash
   npm cache clean --force
   ```

### 2. Problemas com bcrypt e outras dependências nativas

**Problema**: Módulos que requerem compilação, como bcrypt, falham ao instalar.

**Soluções**:
1. Certifique-se de ter o ambiente de compilação correto:
   ```dockerfile
   RUN apk add --no-cache python3 make g++ git
   ```

2. Use a estratégia de multi-stage build para manter apenas os binários compilados na imagem final.

### 3. Memória insuficiente durante a instalação

**Problema**: O processo npm falha devido à falta de memória.

**Soluções**:
1. Aumente os recursos disponíveis durante o build:
   - No Railway, escolha uma opção com mais memória
   - Localmente, aumente o limite de memória do Docker

2. Divida o processo de instalação para pacotes grandes:
   ```bash
   npm install --no-optional
   ```

### 4. Versões incompatíveis do Node.js

**Problema**: Algumas dependências requerem versões específicas do Node.js.

**Soluções**:
1. Verifique a compatibilidade de suas dependências com a versão do Node.js
2. Este projeto está configurado para usar Node.js 18, que oferece bom suporte para os pacotes usados

### 5. Aumentando a verbosidade para diagnóstico

Se os problemas persistirem, aumente a verbosidade dos logs npm:

```bash
npm install --loglevel verbose
```

Para logs ainda mais detalhados:
```bash
npm install --loglevel silly
```

## Estratégia de Fallback

Este projeto implementa uma estratégia de fallback em camadas:

1. Tenta `npm ci` (mais rápido e consistente)
2. Se falhar, tenta `npm install`
3. Se falhar, tenta `npm install --legacy-peer-deps`
4. Se falhar, tenta `npm install --legacy-peer-deps --no-optional`

Esta abordagem resolve a maioria dos problemas de instalação em ambientes Docker.

## Problemas Específicos do Railway

### 1. Timeouts no Build

O Railway tem limites de tempo para builds. Se o processo de build demorar muito, pode atingir um timeout.

**Soluções**:
1. **Otimize o Dockerfile**:
   - Use multi-stage builds
   - Minimize o número de camadas
   - Use caching eficiente de camadas

2. **Reduza o contexto de build**:
   - Otimize seu .dockerignore para excluir arquivos desnecessários

### 2. Problemas com a cache do npm

O Railway pode ter problemas com o cache do npm em alguns casos.

**Soluções**:
1. **Limpe o cache explicitamente**:
   ```dockerfile
   RUN npm cache clean --force
   ```

2. **Use a opção --no-cache-dir**:
   ```dockerfile
   RUN npm install --no-cache-dir
   ```

### 3. Erros de "Container failing health check"

Se o container falha no health check após o deploy, pode indicar problemas na inicialização.

**Soluções**:
1. **Verifique se a aplicação está ouvindo na porta correta**:
   - A variável PORT é definida automaticamente pelo Railway

2. **Aumente o tempo de startup no healthcheck**:
   - No railway.json, aumente o `healthcheckTimeout`

3. **Verifique os logs para erros específicos**
