#!/bin/bash

# Script de construção para Railway e outros ambientes similares de PaaS

echo "🚀 Iniciando script de build para Railway..."

# Limpeza de cache e instalação de dependências
echo "🧹 Limpando cache npm..."
npm cache clean --force

# Instalação de dependências com flags específicas
echo "📦 Instalando dependências..."
npm ci || npm install --no-audit --no-fund

# Gerando cliente Prisma
echo "🔄 Gerando cliente Prisma..."
npx prisma generate

# Construindo a aplicação TypeScript
echo "🏗️ Construindo a aplicação..."
npm run build

echo "✅ Build concluído com sucesso!"
