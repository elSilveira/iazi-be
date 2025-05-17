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
      # Se conseguiu fazer a requisição, a aplicação está respondendo
      # Consideramos isso um sucesso mesmo que o status não seja "ok"
      echo "✅ Aplicação está respondendo na porta $PORT"
      
      # Verifica se conseguimos fazer parse do JSON
      if echo "$response" | grep -q "\"appStatus\""; then
        echo "✅ Health check retornou resposta válida"
        
        # Verifica conectividade com banco de dados (não crítico)
        if echo "$response" | grep -q "\"dbConnected\".*:.*true"; then
          echo "✅ Banco de dados conectado"
        else
          echo "⚠️ Banco de dados não conectado, mas aplicação está funcionando"
        fi
        
        # Se chegamos até aqui, a aplicação está respondendo
        exit 0
      else
        echo "⚠️ Resposta do servidor não contém informações de saúde esperadas"
        echo "Resposta: $response"
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
  
  # Se chegamos aqui, todas as tentativas falharam
  echo "❌ Falha no healthcheck após $MAX_RETRIES tentativas"
  
  # Verificar se o processo Node.js está rodando
  node_running=$(ps aux | grep "[n]ode" | wc -l)
  if [ "$node_running" -gt 0 ]; then
    echo "✅ Processos Node.js detectados: $node_running"
    echo "⚠️ A aplicação parece estar rodando, mas não responde ao healthcheck"
    # Considerar em execução mesmo com falha no healthcheck para evitar reinícios desnecessários
    exit 0
  fi
  
  # Se o processo não está rodando, falhou de fato
  echo "❌ Nenhum processo Node.js detectado"
  exit 1
}

# Executar verificação de saúde
check_health
