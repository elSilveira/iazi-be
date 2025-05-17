#!/bin/bash
# Script para validação completa da imagem Docker localmente

# Definição de cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Validação Completa da Imagem Docker ====${NC}"

# Configurações
IMAGE_NAME="iazi-api-test"
CONTAINER_NAME="iazi-api-container"
NETWORK_NAME="iazi-test-network"
PORT=3002
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/testdb"

# Limpar recursos anteriores
echo -e "${YELLOW}Limpando recursos anteriores...${NC}"
docker rm -f $CONTAINER_NAME 2>/dev/null || true
docker rmi $IMAGE_NAME 2>/dev/null || true
docker network rm $NETWORK_NAME 2>/dev/null || true

# Criar rede para testes
docker network create $NETWORK_NAME

# 1. Construir a imagem
echo -e "${YELLOW}Etapa 1: Construindo imagem Docker...${NC}"
if ! docker build -t $IMAGE_NAME .; then
    echo -e "${RED}❌ Falha ao construir a imagem Docker!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Imagem Docker construída com sucesso!${NC}"

# 2. Verificar tamanho e camadas da imagem
echo -e "${YELLOW}Etapa 2: Analisando imagem Docker...${NC}"
echo -e "${BLUE}Informações da imagem:${NC}"
docker images $IMAGE_NAME --format "Size: {{.Size}}, Created: {{.CreatedSince}}"
echo -e "${BLUE}Número de camadas:${NC}"
docker history $IMAGE_NAME --format "{{.CreatedBy}}" | wc -l

# 3. Iniciando o container
echo -e "${YELLOW}Etapa 3: Iniciando o container...${NC}"
if ! docker run -d --name $CONTAINER_NAME \
    --network $NETWORK_NAME \
    -p $PORT:$PORT \
    -e PORT=$PORT \
    -e NODE_ENV=development \
    -e DATABASE_URL="$DATABASE_URL" \
    -e JWT_SECRET="test-secret" \
    -e REFRESH_TOKEN_SECRET="test-refresh-secret" \
    $IMAGE_NAME; then
    echo -e "${RED}❌ Falha ao iniciar o container!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Container iniciado com ID: $(docker ps -q -f name=$CONTAINER_NAME)${NC}"

# 4. Aguardar inicialização
echo -e "${YELLOW}Etapa 4: Aguardando inicialização da aplicação (15s)...${NC}"
sleep 15

# 5. Verificar logs do container
echo -e "${YELLOW}Etapa 5: Verificando logs do container...${NC}"
docker logs $CONTAINER_NAME > docker-validation-logs.txt

# Verificar erros nos logs
if grep -i "error\|exception\|cannot find module\|Failed\|ECONNREFUSED" docker-validation-logs.txt; then
    echo -e "${RED}⚠️ Encontrados possíveis erros nos logs!${NC}"
    echo -e "${YELLOW}Verificando os 20 últimos logs:${NC}"
    docker logs $CONTAINER_NAME --tail 20
else
    echo -e "${GREEN}✅ Nenhum erro aparente nos logs!${NC}"
fi

# 6. Testar endpoint de saúde
echo -e "${YELLOW}Etapa 6: Testando endpoint de saúde...${NC}"
HEALTH_CHECK_ATTEMPTS=0
MAX_ATTEMPTS=5

while [ $HEALTH_CHECK_ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    HEALTH_RESPONSE=$(curl -s http://localhost:$PORT/api/health)
    HEALTH_STATUS=$?
    
    if [ $HEALTH_STATUS -eq 0 ] && [[ $HEALTH_RESPONSE == *"\"status\":\"ok\""* ]]; then
        echo -e "${GREEN}✅ Endpoint de saúde respondeu corretamente!${NC}"
        echo -e "${BLUE}Resposta: $HEALTH_RESPONSE${NC}"
        break
    else
        HEALTH_CHECK_ATTEMPTS=$((HEALTH_CHECK_ATTEMPTS+1))
        echo -e "${YELLOW}⚠️ Tentativa $HEALTH_CHECK_ATTEMPTS de $MAX_ATTEMPTS falhou. Aguardando...${NC}"
        sleep 3
    fi
    
    if [ $HEALTH_CHECK_ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Endpoint de saúde não respondeu após múltiplas tentativas.${NC}"
        echo -e "${YELLOW}Últimos logs do container:${NC}"
        docker logs $CONTAINER_NAME --tail 20
    fi
done

# 7. Verificar processos em execução no container
echo -e "${YELLOW}Etapa 7: Verificando processos em execução no container...${NC}"
echo -e "${BLUE}Processos:${NC}"
docker exec $CONTAINER_NAME ps aux

# 8. Testar reinicialização do container
echo -e "${YELLOW}Etapa 8: Testando reinicialização do container...${NC}"
docker restart $CONTAINER_NAME
sleep 10
CONTAINER_STATUS=$(docker inspect -f {{.State.Running}} $CONTAINER_NAME)
if [ "$CONTAINER_STATUS" == "true" ]; then
    echo -e "${GREEN}✅ Container reiniciado com sucesso!${NC}"
else
    echo -e "${RED}❌ Falha ao reiniciar o container!${NC}"
    docker logs $CONTAINER_NAME --tail 10
fi

# 9. Limpar recursos
echo -e "${YELLOW}Etapa 9: Limpando recursos...${NC}"
docker stop $CONTAINER_NAME
docker rm $CONTAINER_NAME
docker network rm $NETWORK_NAME
echo -e "${GREEN}✅ Recursos limpos com sucesso!${NC}"

# Conclusão
echo -e "${GREEN}=== Validação concluída! ===${NC}"
echo -e "${BLUE}📋 Logs completos disponíveis em: docker-validation-logs.txt${NC}"
echo -e "${BLUE}🚀 Próximos passos:${NC}"
echo -e "${BLUE}1. Avaliar os resultados da validação${NC}"
echo -e "${BLUE}2. Se tudo estiver correto, enviar as alterações para o GitHub${NC}"
echo -e "${BLUE}3. Fazer deploy no Railway (railway up)${NC}"
echo -e "${BLUE}4. Verificar o status do deploy (railway status)${NC}"
