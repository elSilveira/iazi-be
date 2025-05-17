#!/bin/bash
# railway-npm-fix.sh
# Script para corrigir problemas de npm no Railway

# Definição de cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Verificação e Correção de Problemas npm no Railway ====${NC}"

# Verifica se o package-lock.json está em um estado consistente
echo -e "${YELLOW}Verificando consistência do package-lock.json...${NC}"
if npm ls --prod --json >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Dependencies tree está consistente${NC}"
else
  echo -e "${YELLOW}⚠️ Dependencies tree inconsistente, regenerando package-lock.json...${NC}"
  rm -f package-lock.json
  npm i --package-lock-only
  echo -e "${BLUE}package-lock.json regenerado${NC}"
fi

# Verificar dependências nativas problemáticas
echo -e "${YELLOW}Verificando dependências nativas problemáticas...${NC}"
PROBLEMATIC_DEPS=(
  "bcrypt"
  "node-sass"
  "node-gyp"
  "canvas"
  "sharp"
  "sqlite3"
  "node-expat"
  "libxmljs"
)

for dep in "${PROBLEMATIC_DEPS[@]}"; do
  if npm ls $dep 2>/dev/null | grep -q $dep; then
    echo -e "${YELLOW}⚠️ Detectada dependência nativa problemática: $dep${NC}"
    echo -e "${BLUE}Verificando se está nas dependencies ou devDependencies...${NC}"
    
    if grep -q "\"dependencies\".*\"$dep\"" package.json; then
      echo -e "${GREEN}✓ $dep está em dependencies${NC}"
    elif grep -q "\"devDependencies\".*\"$dep\"" package.json; then
      echo -e "${YELLOW}⚠️ $dep está em devDependencies. Avalie se deve mover para dependencies.${NC}"
      
      if [ "$dep" == "bcrypt" ]; then
        echo -e "${YELLOW}bcrypt é usado em produção para hash de senhas. Movendo para dependencies...${NC}"
        npm uninstall $dep
        npm install $dep --save
        echo -e "${GREEN}✓ bcrypt movido para dependencies${NC}"
      fi
    fi
  fi
done

# Configurar o npm para ser mais resiliente
echo -e "${YELLOW}Configurando npm para ser mais resiliente em ambientes Cloud...${NC}"
cat > .npmrc << EOL
network-timeout=300000
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
prefer-offline=true
registry=https://registry.npmjs.org/
EOL
echo -e "${GREEN}✓ .npmrc configurado para melhor resiliência${NC}"

echo -e "${BLUE}=== Verificação concluída ====${NC}"
echo -e "${YELLOW}Script concluído. Considere fazer um commit das alterações antes do deploy.${NC}"
