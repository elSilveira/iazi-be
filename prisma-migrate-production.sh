#!/bin/bash
# prisma-migrate-production.sh
# Script para executar migrações Prisma em ambiente de produção com segurança

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Execução Segura de Migrações Prisma em Produção ===${NC}"

# Verificar se DATABASE_URL está definido
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ Variável DATABASE_URL não definida!${NC}"
  echo -e "${YELLOW}Por favor, defina a variável de ambiente DATABASE_URL.${NC}"
  exit 1
fi

# 1. Primeiro, validar a conexão com o banco de dados
echo -e "${YELLOW}Etapa 1: Verificando conexão com o banco de dados...${NC}"
if npx prisma db pull --force > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Conexão com o banco de dados válida!${NC}"
else
  echo -e "${RED}❌ Não foi possível conectar ao banco de dados!${NC}"
  echo -e "${YELLOW}Verifique se a URL do banco de dados está correta e se as credenciais são válidas.${NC}"
  exit 1
fi

# 2. Verificar se há migrações pendentes (apenas para validação)
echo -e "${YELLOW}Etapa 2: Verificando migrações pendentes...${NC}"
npx prisma migrate status

# 3. Fazer backup do banco antes das migrações (se possível)
if [[ $DATABASE_URL == *"postgresql"* ]]; then
  echo -e "${YELLOW}Etapa 3: Tentando realizar backup do banco de dados PostgreSQL...${NC}"
  
  # Extrair informações da conexão PostgreSQL
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  # Verificar se as váriaveis foram extraídas corretamente
  if [ -n "$DB_USER" ] && [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then
    BACKUP_FILE="prisma_migration_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if command -v pg_dump &> /dev/null; then
      echo -e "${YELLOW}Tentando executar pg_dump...${NC}"
      if PGPASSWORD="$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')" \
         pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE &> /dev/null; then
        echo -e "${GREEN}✅ Backup realizado com sucesso: $BACKUP_FILE${NC}"
      else
        echo -e "${YELLOW}⚠️ Não foi possível realizar o backup automático. Prosseguindo sem backup.${NC}"
      fi
    else
      echo -e "${YELLOW}⚠️ Comando pg_dump não disponível. Prosseguindo sem backup.${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Não foi possível extrair informações da conexão. Prosseguindo sem backup.${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Backup automático não disponível para este tipo de banco de dados. Prosseguindo sem backup.${NC}"
fi

# 4. Executar as migrações
echo -e "${YELLOW}Etapa 4: Executando as migrações do Prisma...${NC}"
echo -e "${YELLOW}⚠️ ATENÇÃO: As migrações serão aplicadas ao banco de dados em produção!${NC}"
echo -e "${YELLOW}⚠️ Certifique-se de que todas as migrações foram testadas em ambiente de desenvolvimento.${NC}"

read -p "Deseja continuar? (S/n) " -n 1 -r
echo # Nova linha
if [[ $REPLY =~ ^[Nn]$ ]]; then
  echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
  exit 0
fi

# Executar as migrações
if npx prisma migrate deploy; then
  echo -e "${GREEN}✅ Migrações aplicadas com sucesso!${NC}"
else
  echo -e "${RED}❌ Erro ao aplicar as migrações!${NC}"
  echo -e "${YELLOW}Verificando o estado atual do banco de dados...${NC}"
  npx prisma migrate status
  exit 1
fi

# 5. Gerar o cliente Prisma
echo -e "${YELLOW}Etapa 5: Gerando o cliente Prisma...${NC}"
if npx prisma generate; then
  echo -e "${GREEN}✅ Cliente Prisma gerado com sucesso!${NC}"
else
  echo -e "${RED}❌ Erro ao gerar o cliente Prisma!${NC}"
  exit 1
fi

# Conclusão
echo -e "${GREEN}=== Migrações Prisma aplicadas com sucesso! ===${NC}"
echo -e "${BLUE}O banco de dados foi atualizado conforme o esquema Prisma.${NC}"
echo -e "${BLUE}Verifique a aplicação para garantir que tudo está funcionando corretamente.${NC}"
