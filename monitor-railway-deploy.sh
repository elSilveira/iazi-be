#!/bin/bash
# monitor-railway-deploy.sh
# Script para monitorar o status de um deploy no Railway

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Monitoramento de Deploy no Railway ===${NC}"

# Verificar se a CLI do Railway está instalada
if ! command -v railway &> /dev/null; then
  echo -e "${RED}❌ Railway CLI não está instalada!${NC}"
  echo -e "${YELLOW}Por favor, instale a CLI do Railway com: npm install -g @railway/cli${NC}"
  exit 1
fi

# Verificar se está logado no Railway
railway whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Você não está logado no Railway!${NC}"
  echo -e "${YELLOW}Por favor, faça login com: railway login${NC}"
  exit 1
fi

# Verificar status do deploy
echo -e "${YELLOW}Verificando status atual do deploy...${NC}"
railway status

# Monitor contínuo
echo -e "${YELLOW}Iniciando monitoramento contínuo (Ctrl+C para sair)...${NC}"
echo -e "${BLUE}Atualizando a cada 10 segundos${NC}"

while true; do
  clear
  echo -e "${BLUE}=== Monitoramento de Deploy no Railway ===${NC}"
  echo -e "${YELLOW}Última atualização: $(date)${NC}"
  
  # Obter status do deploy
  railway status
  
  # Verificar os logs mais recentes
  echo -e "${YELLOW}Logs recentes:${NC}"
  railway logs --limit 5
  
  # Aguardar 10 segundos
  sleep 10
done
