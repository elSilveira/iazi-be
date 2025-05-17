#!/bin/bash
# check-dependencies.sh
# Script para verificar dependências problemáticas antes do build

# Definição de cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Verificação de Dependências ====${NC}"

# Verificar se o package.json existe
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json não encontrado!${NC}"
  exit 1
fi

# Verificar se bcrypt está nas dependencies
if grep -q '"bcrypt"' package.json && ! grep -q '"dependencies".*"bcrypt"' package.json; then
  echo -e "${RED}❌ bcrypt não está em dependencies!${NC}"
  echo -e "${YELLOW}bcrypt é uma dependência crítica para autenticação e deve estar em dependencies, não devDependencies.${NC}"
  echo -e "${YELLOW}Considere mover bcrypt para dependencies usando:${NC}"
  echo -e "${BLUE}npm install bcrypt --save${NC}"
else
  echo -e "${GREEN}✓ bcrypt está corretamente em dependencies${NC}"
fi

# Verificar se prisma está em devDependencies
if grep -q '"prisma"' package.json && ! grep -q '"devDependencies".*"prisma"' package.json; then
  echo -e "${RED}❌ prisma não está em devDependencies!${NC}"
  echo -e "${YELLOW}prisma deve estar em devDependencies, com @prisma/client em dependencies.${NC}"
else
  echo -e "${GREEN}✓ prisma está corretamente em devDependencies${NC}"
fi

# Verificar se @prisma/client está em dependencies
if grep -q '"@prisma/client"' package.json && ! grep -q '"dependencies".*"@prisma/client"' package.json; then
  echo -e "${RED}❌ @prisma/client não está em dependencies!${NC}"
  echo -e "${YELLOW}@prisma/client deve estar em dependencies.${NC}"
else
  echo -e "${GREEN}✓ @prisma/client está corretamente em dependencies${NC}"
fi

# Verificar se o script postinstall existe para prisma generate
if grep -q '"postinstall".*"prisma generate"' package.json; then
  echo -e "${GREEN}✓ script postinstall encontrado para prisma generate${NC}"
else
  echo -e "${RED}❌ script postinstall não encontrado para prisma generate!${NC}"
  echo -e "${YELLOW}Adicione o seguinte script ao package.json:${NC}"
  echo -e "${BLUE}\"postinstall\": \"prisma generate\"${NC}"
fi

# Verificar dependências com histórico de problemas no Docker
PROBLEM_DEPS=("node-gyp" "canvas" "sharp" "sqlite3" "node-sass")
for dep in "${PROBLEM_DEPS[@]}"; do
  if grep -q "\"$dep\"" package.json; then
    echo -e "${YELLOW}⚠️ $dep detectado - pode causar problemas no Docker/Railway${NC}"
    echo -e "${YELLOW}Certifique-se de ter as dependências de sistema necessárias no Dockerfile:${NC}"
    echo -e "${BLUE}RUN apk add --no-cache python3 make g++ git${NC}"
  fi
done

# Verificar versão do Node.js no Dockerfile
if [ -f "Dockerfile" ]; then
  NODE_VERSION=$(grep -o 'FROM node:[0-9]*' Dockerfile | head -1 | grep -o '[0-9]*')
  if [ "$NODE_VERSION" == "18" ]; then
    echo -e "${GREEN}✓ Usando Node.js 18 no Dockerfile (recomendado)${NC}"
  else
    echo -e "${YELLOW}⚠️ Não está usando Node.js 18 no Dockerfile. Versão atual: $NODE_VERSION${NC}"
    echo -e "${YELLOW}Node.js 18 é recomendado para melhor compatibilidade.${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Dockerfile não encontrado${NC}"
fi

echo -e "${BLUE}=== Verificação de dependências concluída ====${NC}"
