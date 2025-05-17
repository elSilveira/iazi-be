#!/bin/bash
# validate-npm-install.sh
# Script para testar especificamente a instalação npm em um ambiente Docker

# Definição de cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Validação do Processo de Instalação npm no Docker ===${NC}"

# Nome da imagem para teste
IMAGE_NAME="npm-install-test"

# Criar arquivo Dockerfile temporário apenas para o teste de instalação
cat > Dockerfile.npmtest << EOL
FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache python3 make g++ git

# Copiar apenas arquivos necessários para instalação
COPY package*.json ./
COPY .npmrc ./
COPY prisma ./prisma/

# Configurações de rede do npm
RUN npm config set network-timeout 300000 && \\
    npm config set fetch-retries 3 && \\
    npm config set fetch-retry-mintimeout 15000 && \\
    npm config set fetch-retry-maxtimeout 120000

# Limpar cache e instalar dependências com várias opções de fallback
RUN npm cache clean --force && \\
    npm install --verbose || \\
    npm install --verbose --legacy-peer-deps || \\
    npm install --verbose --legacy-peer-deps --no-optional

# Gerar cliente Prisma
RUN npx prisma generate

# Comando para verificar se a instalação foi bem-sucedida
CMD ["npm", "ls", "--depth=0"]
EOL

echo -e "${YELLOW}Dockerfile de teste criado.${NC}"

# Remover imagem anterior
docker rmi $IMAGE_NAME 2>/dev/null || true

# Construir imagem de teste
echo -e "${YELLOW}Iniciando build da imagem de teste...${NC}"
if docker build -t $IMAGE_NAME -f Dockerfile.npmtest .; then
  echo -e "${GREEN}✅ Build bem-sucedido! npm install passou no teste!${NC}"
  
  # Executar npm ls para verificar se todas as dependências foram instaladas corretamente
  echo -e "${YELLOW}Verificando as dependências instaladas:${NC}"
  docker run --rm $IMAGE_NAME
  
  # Remover imagem de teste
  docker rmi $IMAGE_NAME
  
  # Remover Dockerfile temporário
  rm Dockerfile.npmtest
  
  echo -e "${GREEN}=== Validação concluída com sucesso! ===${NC}"
  echo -e "${BLUE}A instalação npm deve funcionar corretamente no seu Dockerfile principal.${NC}"
  exit 0
else
  echo -e "${RED}❌ Falha no build! O npm install falhou.${NC}"
  echo -e "${YELLOW}Registrando os logs do build para análise...${NC}"
  
  # Criar pasta para logs se não existir
  mkdir -p logs
  
  # Tentar novamente com logs mais detalhados direcionados para um arquivo
  docker build -t $IMAGE_NAME -f Dockerfile.npmtest . > logs/npm-install-test.log 2>&1
  
  echo -e "${YELLOW}Detalhes do erro disponíveis em: logs/npm-install-test.log${NC}"
  echo -e "${YELLOW}Verificando o final do log de erro:${NC}"
  tail -n 30 logs/npm-install-test.log
  
  # Remover Dockerfile temporário
  rm Dockerfile.npmtest
  
  echo -e "${RED}=== Validação falhou! ===${NC}"
  echo -e "${BLUE}Possíveis soluções:${NC}"
  echo -e "${BLUE}1. Verifique se todas as dependências no package.json são compatíveis com Node.js 18${NC}"
  echo -e "${BLUE}2. Tente remover o package-lock.json e gerar um novo${NC}"
  echo -e "${BLUE}3. Verifique dependências com problemas conhecidos (como bcrypt)${NC}"
  echo -e "${BLUE}4. Consulte o documento NPM-INSTALL-TROUBLESHOOTING.md para mais soluções${NC}"
  exit 1
fi
