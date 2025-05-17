#!/bin/sh
# healthcheck.sh
# Script para verificar a saúde da aplicação

# Configurações
HOST="localhost"
PORT="${PORT:-3002}" # Usa valor da variável PORT ou 3002 como padrão
ENDPOINT="/api/health"
TIMEOUT=10

echo "🩺 Verificando saúde da aplicação em http://$HOST:$PORT$ENDPOINT"

# Tenta acessar o endpoint de saúde
response=$(wget --quiet --tries=1 --timeout=$TIMEOUT -O- http://$HOST:$PORT$ENDPOINT 2>&1)
status=$?

# Verifica o status da requisição
if [ $status -ne 0 ]; then
  echo "❌ Falha ao acessar endpoint de saúde: status=$status"
  exit 1
fi

# Verifica se a resposta contém "status": "ok"
if echo "$response" | grep -q "\"status\".*:.*\"ok\""; then
  echo "✅ Aplicação está saudável"
  exit 0
else
  echo "❌ Resposta inesperada do endpoint de saúde: $response"
  exit 1
fi
