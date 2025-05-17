# Arquivo de instruções para deploy no Railway

## Troubleshooting

Se você encontrar o erro `Cannot find module '@prisma/client'` ao fazer deploy no Railway, siga estas etapas:

1. Verifique se o `@prisma/client` está nas dependências de produção no package.json (não em devDependencies)
2. Certifique-se de que o script `postinstall` está executando `prisma generate`
3. Se os problemas persistirem, tente adicionar o script personalizado de build do Railway 

## Configuração do Banco de Dados

Certifique-se de que você configurou corretamente a variável de ambiente DATABASE_URL no Railway.

## Variáveis de Ambiente Necessárias

- `DATABASE_URL` - URL de conexão com o banco de dados PostgreSQL
- `JWT_SECRET` - Chave secreta para tokens JWT
- `REFRESH_TOKEN_SECRET` - Chave secreta para tokens de atualização
- `PORT` - Porta em que o servidor será executado (Railway configura isso automaticamente)

## Migrações do Banco de Dados

Para executar migrações no Railway, você pode usar:

```
npx prisma migrate deploy
```

## Problemas Comuns

1. **Conexão com o Banco de Dados**
   - Verifique se a URL de conexão está correta
   - O Railway pode exigir SSL para conexões - certifique-se de que sua string de conexão inclui isso

2. **Prisma Client Não Encontrado**
   - Certifique-se de que o `postinstall` está configurado para gerar o cliente Prisma

3. **Erros de Porta**
   - O Railway configura a porta automaticamente. Certifique-se de que seu código lê do `process.env.PORT`
