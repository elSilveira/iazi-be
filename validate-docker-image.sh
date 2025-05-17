#!/bin/bash
# Script para validar localmente a imagem Docker antes do deploy

echo "🔍 Iniciando validação local da imagem Docker..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
  echo "❌ Docker não está instalado ou não está no PATH. Por favor instale Docker."
  exit 1
fi

# Nome da imagem para teste
IMAGE_NAME="iazi-api-test"
CONTAINER_NAME="iazi-api-validator"

# Limpar containers e imagens antigas se existirem
echo "🧹 Limpando recursos antigos..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true
docker rmi $IMAGE_NAME 2>/dev/null || true

# Construir a imagem Docker
echo "🏗️ Construindo imagem Docker..."
if ! docker build -t $IMAGE_NAME .; then
  echo "❌ Falha ao construir a imagem Docker!"
  exit 1
fi
echo "✅ Imagem Docker construída com sucesso!"

# Criar uma rede para os testes
NETWORK_NAME="iazi-test-network"
docker network create $NETWORK_NAME 2>/dev/null || true

# Executar o container com variáveis de ambiente de teste
echo "🚀 Iniciando container para validação..."
if ! docker run --name $CONTAINER_NAME --network $NETWORK_NAME -d \
  -e NODE_ENV=development \
  -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/testdb" \
  -e JWT_SECRET="test-secret" \
  -e REFRESH_TOKEN_SECRET="test-refresh-secret" \
  -e PORT=3002 \
  $IMAGE_NAME; then
  echo "❌ Falha ao iniciar o container!"
  exit 1
fi

# Aguardar a inicialização do container
echo "⏳ Aguardando inicialização do container..."
sleep 5

# Verificar logs do container para erros
echo "📜 Verificando logs do container..."
if docker logs $CONTAINER_NAME | grep -i "error\|exception\|cannot find module"; then
  echo "⚠️ Encontrados possíveis erros nos logs do container!"
  docker logs $CONTAINER_NAME
else
  echo "✅ Nenhum erro encontrado nos logs!"
fi

# Verificar se o processo principal está em execução
echo "🔄 Verificando processo principal..."
if docker exec $CONTAINER_NAME ps aux | grep -q "node dist/index"; then
  echo "✅ Processo principal está em execução!"
else
  echo "❌ Processo principal não está em execução!"
  docker logs $CONTAINER_NAME
  docker rm -f $CONTAINER_NAME
  exit 1
fi

# Limpar recursos
echo "🧹 Limpando recursos..."
docker rm -f $CONTAINER_NAME
docker network rm $NETWORK_NAME

echo "✅ Validação concluída com sucesso! A imagem está pronta para deploy."
