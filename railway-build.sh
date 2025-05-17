#!/bin/bash

# Script de construção para Railway e outros ambientes similares de PaaS

echo "🚀 Iniciando script de build para Railway..."

# Instalação de dependências
echo "📦 Instalando dependências..."
npm install

# Gerando cliente Prisma
echo "🔄 Gerando cliente Prisma..."
npx prisma generate

# Construindo a aplicação TypeScript
echo "🏗️ Construindo a aplicação..."
npm run build

echo "✅ Build concluído com sucesso!"
