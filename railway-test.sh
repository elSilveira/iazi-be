#!/bin/bash
# railway-test.sh
# Script para verificação rápida após deploy no Railway

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Verificação Pós-Deploy no Railway ===${NC}"

# Verificar se a URL foi fornecida
if [ -z "$1" ]; then
  echo -e "${RED}❌ URL da aplicação não fornecida!${NC}"
  echo -e "${YELLOW}Uso: ./railway-test.sh <URL-da-aplicacao>${NC}"
  echo -e "${YELLOW}Exemplo: ./railway-test.sh https://iazi-api-production.up.railway.app${NC}"
  exit 1
fi

APP_URL=$1

# 1. Verificar se a aplicação está acessível
echo -e "${YELLOW}Etapa 1: Verificando acessibilidade...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)

if [ $RESPONSE -eq 200 ] || [ $RESPONSE -eq 301 ] || [ $RESPONSE -eq 302 ]; then
  echo -e "${GREEN}✅ Aplicação acessível! Status HTTP: $RESPONSE${NC}"
else
  echo -e "${RED}❌ Falha ao acessar a aplicação! Status HTTP: $RESPONSE${NC}"
  echo -e "${YELLOW}Verificando com mais detalhes...${NC}"
  curl -v $APP_URL
fi

# 2. Verificar endpoint de saúde
echo -e "${YELLOW}Etapa 2: Verificando endpoint de saúde...${NC}"
HEALTH_RESPONSE=$(curl -s $APP_URL/api/health)
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -eq 0 ] && [[ $HEALTH_RESPONSE == *"\"status\":\"ok\""* ]]; then
  echo -e "${GREEN}✅ Endpoint de saúde respondeu corretamente!${NC}"
  echo -e "${BLUE}Resposta: $HEALTH_RESPONSE${NC}"
else
  echo -e "${RED}❌ Problemas com o endpoint de saúde!${NC}"
  echo -e "${YELLOW}Resposta: $HEALTH_RESPONSE${NC}"
fi

# 3. Verificar informações da API
echo -e "${YELLOW}Etapa 3: Verificando informações da API...${NC}"
ROOT_RESPONSE=$(curl -s $APP_URL)
if [[ $ROOT_RESPONSE == *"rodando"* ]]; then
  echo -e "${GREEN}✅ API retornou resposta válida na rota raiz!${NC}"
else
  echo -e "${RED}❌ Resposta inválida na rota raiz!${NC}"
  echo -e "${YELLOW}Resposta: $ROOT_RESPONSE${NC}"
fi

# 4. Verificar disponibilidade da documentação Swagger
echo -e "${YELLOW}Etapa 4: Verificando documentação Swagger...${NC}"
SWAGGER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api-docs)
if [ $SWAGGER_RESPONSE -eq 200 ]; then
  echo -e "${GREEN}✅ Documentação Swagger disponível!${NC}"
else
  echo -e "${RED}❌ Documentação Swagger indisponível! Status: $SWAGGER_RESPONSE${NC}"
fi

# Conclusão
echo -e "${BLUE}=== Verificação Pós-Deploy Concluída ===${NC}"
echo -e "${YELLOW}Para monitoramento contínuo, verifique o painel de controle do Railway.${NC}"
