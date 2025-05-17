#!/bin/bash

# Script de construção para Railway e outros ambientes similares de PaaS

echo "🚀 Iniciando script de build para Railway..."

# Configurar npm para melhor desempenho e resiliência
echo "⚙️ Configurando npm para melhor desempenho..."
npm config set network-timeout 300000
npm config set fetch-retries 3
npm config set fetch-retry-mintimeout 15000
npm config set fetch-retry-maxtimeout 120000

# Limpeza de cache e instalação de dependências
echo "🧹 Limpando cache npm..."
npm cache clean --force

# Instalação de dependências com flags específicas
echo "📦 Instalando dependências (tentativa 1)..."
if npm ci --no-audit --no-fund --loglevel verbose; then
  echo "✅ Instalação concluída com sucesso usando npm ci!"
else
  echo "⚠️ Falha na primeira tentativa de instalação, tentando com npm install..."
  if npm install --no-audit --no-fund --loglevel verbose; then
    echo "✅ Instalação concluída com sucesso usando npm install!"
  else
    echo "⚠️ Falha na segunda tentativa, tentando com --legacy-peer-deps..."
    if npm install --no-audit --no-fund --loglevel verbose --legacy-peer-deps; then
      echo "✅ Instalação concluída com sucesso usando --legacy-peer-deps!"
    else
      echo "⚠️ Falha na terceira tentativa, tentando com --no-optional..."
      if npm install --no-audit --no-fund --loglevel verbose --legacy-peer-deps --no-optional; then
        echo "✅ Instalação concluída com sucesso usando --no-optional!"
      else
        echo "❌ Todas as tentativas de instalação falharam. Verificando detalhes..."
        npm --version
        node --version
        echo "Conteúdo de package.json:"
        cat package.json
        exit 1
      fi
    fi
  fi
fi

# Gerando cliente Prisma
echo "🔄 Gerando cliente Prisma..."
npx prisma generate

# Construindo a aplicação TypeScript
echo "🏗️ Construindo a aplicação..."
npm run build

echo "✅ Build concluído com sucesso!"
