# Documentação: Validação de Entrada e Tratamento de Erros

Este documento descreve a implementação do sistema de validação de entrada e tratamento de erros no backend do ServiConnect (`iazi-be`), utilizando `express-validator` e um middleware de erro global.

## 1. Validação de Entrada com `express-validator`

Para garantir a integridade e a segurança dos dados recebidos pela API, utilizamos a biblioteca `express-validator`.

### 1.1. Instalação

A biblioteca foi instalada como dependência do projeto:
```bash
npm install express-validator
```

### 1.2. Validadores Específicos

*   **Localização:** Os validadores para cada entidade (ou conjunto de rotas) estão localizados na pasta `src/validators/`.
*   **Estrutura:** Cada arquivo (ex: `authValidators.ts`, `companyValidators.ts`) exporta arrays de middlewares de validação do `express-validator` (usando `body`, `param`, `query`).
*   **Exemplo (`authValidators.ts`):**
    ```typescript
    import { body } from "express-validator";

    export const registerValidator = [
      body("email").trim().notEmpty().isEmail().normalizeEmail(),
      body("password").isLength({ min: 6 }),
      body("name").trim().notEmpty(),
      // ... outras validações
    ];

    export const loginValidator = [
      body("email").trim().notEmpty().isEmail().normalizeEmail(),
      body("password").notEmpty(),
    ];
    ```
*   **Arquivos Criados:**
    *   `src/validators/authValidators.ts`
    *   `src/validators/companyValidators.ts`
    *   `src/validators/serviceValidators.ts`
    *   `src/validators/professionalValidators.ts`
    *   `src/validators/appointmentValidators.ts`
    *   `src/validators/reviewValidators.ts`

### 1.3. Middleware de Processamento da Validação

*   **Arquivo:** `src/middlewares/validationMiddleware.ts`
*   **Função:** `validateRequest`
*   **Propósito:** Este middleware é chamado *após* os validadores específicos em uma rota. Ele utiliza `validationResult(req)` do `express-validator` para verificar se houve erros de validação.
*   **Comportamento:**
    *   Se houver erros, ele interrompe a cadeia de middlewares e retorna uma resposta `400 Bad Request` com os erros encontrados.
    *   Se não houver erros, ele chama `next()` para passar o controle para o próximo middleware ou para o controller da rota.
*   **Código:**
    ```typescript
    import { Request, Response, NextFunction } from "express";
    import { validationResult } from "express-validator";

    export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Erro de validação", errors: errors.array() });
      }
      next();
    };
    ```

### 1.4. Aplicação nas Rotas

*   Os validadores específicos e o middleware `validateRequest` são aplicados como middlewares nas definições de rota nos arquivos dentro de `src/routes/`.
*   **Exemplo (`authRoutes.ts`):**
    ```typescript
    import { Router } from "express";
    import { login, register } from "../controllers/authController";
    import { registerValidator, loginValidator } from "../validators/authValidators";
    import { validateRequest } from "../middlewares/validationMiddleware";

    const router = Router();

    // Aplica o array de validadores e depois o middleware de validação
    router.post("/register", registerValidator, validateRequest, register);
    router.post("/login", loginValidator, validateRequest, login);

    export default router;
    ```
*   **Arquivos Modificados/Criados:**
    *   `src/routes/authRoutes.ts`
    *   `src/routes/companyRoutes.ts`
    *   `src/routes/serviceRoutes.ts`
    *   `src/routes/professionalRoutes.ts` (Criado)
    *   `src/routes/appointmentRoutes.ts` (Criado)
    *   `src/routes/reviewRoutes.ts` (Criado)

## 2. Tratamento de Erros Global

Para centralizar e padronizar o tratamento de erros em toda a aplicação, foi implementado um middleware de erro global.

### 2.1. Middleware de Erro Global

*   **Arquivo:** `src/middlewares/errorMiddleware.ts`
*   **Função:** `errorMiddleware`
*   **Propósito:** Este middleware é o último a ser registrado na aplicação Express (após todas as rotas). Ele captura quaisquer erros que ocorram durante o processamento da requisição, sejam eles lançados explicitamente ou passados através de `next(error)`.
*   **Funcionalidades:**
    *   Loga detalhes do erro no console para depuração.
    *   Define um `statusCode` e uma `message` padrão.
    *   Trata erros específicos do Prisma (`PrismaClientKnownRequestError`), mapeando códigos de erro comuns (P2002, P2025, P2003) para mensagens e status HTTP apropriados (409, 404).
    *   Possui placeholders para tratamento de outros erros específicos da aplicação (ex: `AuthenticationError`, `AuthorizationError`).
    *   Em ambiente de produção, evita vazar detalhes de erros internos (status 500).
    *   Retorna uma resposta JSON padronizada com `status` e `message`.
*   **Registro:** Este middleware deve ser registrado no arquivo principal da aplicação (`src/index.ts` ou similar) *após* o registro de todas as rotas.
    ```typescript
    // Exemplo em src/index.ts
    import express from 'express';
    import { errorMiddleware } from './middlewares/errorMiddleware';
    // ... outras importações e configurações ...
    
    const app = express();
    // ... middlewares (cors, json, etc.) ...
    // ... registro das rotas ...
    
    // Registrar o middleware de erro global POR ÚLTIMO
    app.use(errorMiddleware);
    
    // ... inicialização do servidor ...
    ```

### 2.2. Refatoração dos Controllers

*   Os controllers (ex: `authController.ts`, `companyController.ts`, `serviceController.ts`) foram refatorados para utilizar o tratamento de erros global.
*   **Mudanças Principais:**
    *   Adição do parâmetro `NextFunction` às funções assíncronas dos controllers.
    *   Remoção de blocos `try...catch` que tratavam erros localmente e retornavam respostas de erro diretamente.
    *   Em vez disso, os blocos `try...catch` agora chamam `next(error)` para passar qualquer erro capturado para o middleware de erro global.
    *   Erros específicos de lógica de negócios (ex: "Credenciais inválidas", "Recurso não encontrado") são agora lançados como instâncias de `Error` (ou classes de erro customizadas) com uma propriedade `statusCode` definida, e então passados para `next()`.
*   **Exemplo (Refatorado):**
    ```typescript
    // Em um controller
    export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = req.params;
      try {
        const resource = await repository.findById(id);
        if (!resource) {
          const error: any = new Error("Recurso não encontrado");
          error.statusCode = 404;
          return next(error); // Passa o erro 404 para o middleware global
        }
        res.json(resource);
      } catch (error) {
        next(error); // Passa erros do repositório/inesperados para o middleware global
      }
    };
    ```

## 3. Próximos Passos (Testes)

Com a validação e o tratamento de erros implementados e aplicados:

1.  **Registrar Middlewares:** Garantir que o `errorMiddleware` esteja registrado corretamente no `src/index.ts`.
2.  **Testar Validação:** Enviar requisições com dados inválidos para as rotas e verificar se a resposta `400 Bad Request` é retornada com os erros corretos.
3.  **Testar Tratamento de Erros:**
    *   Simular erros do Prisma (ex: tentar criar usuário com email duplicado - P2002) e verificar se o middleware global retorna a resposta apropriada (ex: 409 Conflict).
    *   Tentar buscar/atualizar/deletar recursos com IDs inexistentes e verificar se a resposta `404 Not Found` é retornada.
    *   Testar outros cenários de erro para garantir que o middleware global os capture e trate corretamente.

Esta implementação fornece uma base sólida para validação de dados e tratamento de erros consistente em toda a aplicação.
