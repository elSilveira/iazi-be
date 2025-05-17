#!/bin/bash
# validate-docker-build.sh
# Script para testar se o build do Docker funciona localmente

# Definição de cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Validação do Build Docker ====${NC}"

# Nome da imagem para teste
IMAGE_NAME="iazi-api-test"

# Remover imagem anterior se existir
echo -e "${YELLOW}Removendo imagem anterior (se existir)...${NC}"
docker rmi $IMAGE_NAME 2>/dev/null || true

# Construir a imagem
echo -e "${YELLOW}Iniciando build da imagem...${NC}"
if docker build -t $IMAGE_NAME .; then
  echo -e "${GREEN}✅ Build bem-sucedido!${NC}"
  
  # Mostrar detalhes da imagem
  echo -e "${YELLOW}Detalhes da imagem:${NC}"
  docker images $IMAGE_NAME --format "Repository: {{.Repository}}, Tag: {{.Tag}}, Size: {{.Size}}, Created: {{.CreatedSince}}"
  
  # Executar container para teste
  echo -e "${YELLOW}Executando container para teste...${NC}"
  CONTAINER_ID=$(docker run -d -p 3002:3002 \
    -e NODE_ENV=development \
    -e DATABASE_URL="postgresql://fake_user:fake_password@localhost:5432/fake_db" \
    -e JWT_SECRET="test_secret" \
    -e REFRESH_TOKEN_SECRET="test_refresh_secret" \
    $IMAGE_NAME)
  
  echo -e "${YELLOW}Container iniciado com ID: $CONTAINER_ID${NC}"
  echo -e "${YELLOW}Aguardando inicialização (10s)...${NC}"
  sleep 10
  
  # Verificar logs
  echo -e "${YELLOW}Logs do container:${NC}"
  docker logs $CONTAINER_ID
  
  # Parar e remover o container
  echo -e "${YELLOW}Parando e removendo o container...${NC}"
  docker stop $CONTAINER_ID
  docker rm $CONTAINER_ID
  
  echo -e "${GREEN}=== Validação concluída com sucesso! ====${NC}"
  echo -e "${BLUE}A imagem Docker pode ser construída com sucesso localmente.${NC}"
  echo -e "${BLUE}Próximos passos:${NC}"
  echo -e "${BLUE}1. Verificar se o Railway tem acesso às dependências de sistema necessárias${NC}"
  echo -e "${BLUE}2. Verificar se o cache de camadas do Docker está funcionando corretamente no Railway${NC}"
  echo -e "${BLUE}3. Deploy no Railway com: railway up${NC}"
else
  echo -e "${RED}❌ Falha no build!${NC}"
  echo -e "${YELLOW}Verificando logs detalhados...${NC}"
  
  # Criar pasta para logs se não existir
  mkdir -p logs
  
  # Tentar novamente com logs mais detalhados
  docker build -t $IMAGE_NAME . > logs/docker-build-error.log 2>&1
  
  echo -e "${YELLOW}Detalhes do erro disponíveis em: logs/docker-build-error.log${NC}"
  echo -e "${YELLOW}Últimas 20 linhas do log:${NC}"
  tail -n 20 logs/docker-build-error.log
  
  echo -e "${RED}=== Validação falhou! ====${NC}"
  echo -e "${BLUE}Possíveis soluções:${NC}"
  echo -e "${BLUE}1. Verifique se todas as dependências nativas são compiláveis no ambiente Alpine${NC}"
  echo -e "${BLUE}2. Verifique se o bcrypt está causando problemas (agora nas dependencies)${NC}"
  echo -e "${BLUE}3. Considere usar --no-optional ou --legacy-peer-deps durante a instalação${NC}"
  echo -e "${BLUE}4. Verifique a versão do Node.js (atualmente usando 18)${NC}"
fi
