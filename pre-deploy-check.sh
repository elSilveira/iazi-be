#!/bin/bash

# Script para verificar problemas comuns antes do deploy

echo "🔍 Verificando problemas comuns antes do deploy..."

# Verificar se o @prisma/client está nas dependências de produção
if grep -q "\"@prisma/client\"" package.json; then
  if grep -q "\"dependencies\": {" -A 20 package.json | grep -q "\"@prisma/client\""; then
    echo "✅ @prisma/client está nas dependências de produção."
  else
    echo "❌ ERRO: @prisma/client não está nas dependências de produção!"
    echo "   Por favor, mova @prisma/client de devDependencies para dependencies no package.json."
    exit 1
  fi
else
  echo "❌ ERRO: @prisma/client não encontrado no package.json!"
  exit 1
fi

# Verificar se o script postinstall existe
if grep -q "\"postinstall\":" package.json; then
  if grep -q "\"postinstall\": \"prisma generate\"" package.json; then
    echo "✅ Script postinstall está configurado corretamente."
  else
    echo "⚠️ Aviso: O script postinstall existe mas pode não estar executando 'prisma generate'."
  fi
else
  echo "❌ ERRO: Script postinstall não encontrado no package.json!"
  echo "   Adicione \"postinstall\": \"prisma generate\" aos scripts no package.json."
  exit 1
fi

# Verificar existência de .env com variáveis necessárias
if [ -f .env ]; then
  echo "✅ Arquivo .env encontrado."
  # Verificar variáveis essenciais
  for var in DATABASE_URL JWT_SECRET REFRESH_TOKEN_SECRET; do
    if grep -q "^$var=" .env; then
      echo "   ✅ $var configurado."
    else
      echo "   ⚠️ Aviso: $var não encontrado no .env."
    fi
  done
else
  echo "⚠️ Aviso: Arquivo .env não encontrado. Certifique-se de configurar as variáveis de ambiente no Railway."
fi

# Verificar schema.prisma
if [ -f prisma/schema.prisma ]; then
  echo "✅ schema.prisma encontrado."
else
  echo "❌ ERRO: prisma/schema.prisma não encontrado!"
  exit 1
fi

# Verificar Dockerfile
if [ -f Dockerfile ]; then
  if grep -q "prisma generate" Dockerfile; then
    echo "✅ Dockerfile tem comando para gerar Prisma Client."
  else
    echo "⚠️ Aviso: Dockerfile pode não estar gerando o Prisma Client."
  fi
else
  echo "⚠️ Aviso: Dockerfile não encontrado. Se você estiver usando Railway diretamente, isso pode não ser um problema."
fi

echo "✅ Verificação concluída."
