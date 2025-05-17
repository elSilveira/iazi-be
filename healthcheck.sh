#!/bin/sh
# healthcheck.sh
# Script para verificar a saúde da aplicação com detecção aprimorada de problemas

# Configurações
HOST="localhost"
PORT="${PORT:-3002}" # Usa valor da variável PORT ou 3002 como padrão
ENDPOINT="/api/health"
TIMEOUT=15
MAX_RETRIES=3
RETRY_INTERVAL=5

echo "🩺 Verificando saúde da aplicação em http://$HOST:$PORT$ENDPOINT"

# Função para verificar saúde com múltiplas tentativas
check_health() {
  for i in $(seq 1 $MAX_RETRIES); do
    echo "🔄 Tentativa $i de $MAX_RETRIES..."
    
    # Usa wget para fazer a requisição HTTP
    response=$(wget --quiet --tries=1 --timeout=$TIMEOUT -O- "http://$HOST:$PORT$ENDPOINT" 2>&1)
    status=$?
    
    # Verificações adicionais
    if [ $status -eq 0 ]; then
      # Verifica se a resposta contém "status": "ok"
      if echo "$response" | grep -q "\"status\".*:.*\"ok\""; then
        echo "✅ Aplicação está saudável"
        
        # Verifica conectividade com banco de dados
        if echo "$response" | grep -q "\"dbConnected\".*:.*true"; then
          echo "✅ Banco de dados conectado"
          exit 0
        else
          echo "⚠️ Banco de dados não conectado"
          # Se estamos na última tentativa, falha; caso contrário, tenta novamente
          if [ $i -eq $MAX_RETRIES ]; then
            echo "❌ Falha na conexão com o banco de dados após $MAX_RETRIES tentativas"
            exit 1
          fi
        fi
      else
        echo "⚠️ Resposta do servidor indica problema: $response"
      fi
    else
      echo "⚠️ Falha ao acessar endpoint de saúde: status=$status"
    fi
    
    # Se não é a última tentativa, aguarda antes de tentar novamente
    if [ $i -lt $MAX_RETRIES ]; then
      echo "⏳ Aguardando $RETRY_INTERVAL segundos antes de tentar novamente..."
      sleep $RETRY_INTERVAL
    fi
  done
  
  echo "❌ Falha após $MAX_RETRIES tentativas"
  exit 1
}

check_health
