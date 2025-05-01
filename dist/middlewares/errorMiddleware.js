"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const client_1 = require("@prisma/client");
/**
 * Middleware global para tratamento de erros.
 * Captura erros passados por next(error) ou lançados em rotas assíncronas.
 */
const errorMiddleware = (err, req, res, next) => {
    var _a;
    console.error("\n--- Global Error Handler ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Request URL:", req.originalUrl);
    console.error("Request Method:", req.method);
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    console.error("--------------------------\n");
    let statusCode = err.statusCode || 500;
    let message = err.message || "Erro interno do servidor";
    // Tratamento específico para erros do Prisma
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                // Unique constraint violation
                // Tenta extrair o campo que causou a violação
                const target = (_a = err.meta) === null || _a === void 0 ? void 0 : _a.target;
                message = `Erro: Já existe um registro com este ${target ? target.join(', ') : 'valor'}.`;
                statusCode = 409; // Conflict
                break;
            case 'P2025':
                // Record to update/delete not found
                message = "Erro: Registro não encontrado para a operação solicitada.";
                statusCode = 404; // Not Found
                break;
            case 'P2003':
                // Foreign key constraint failed
                message = "Erro: A operação falhou devido a uma restrição de chave estrangeira.";
                statusCode = 409; // Conflict
                break;
            // Adicionar outros códigos de erro do Prisma conforme necessário
            default:
                message = "Erro no banco de dados.";
                statusCode = 500;
                break;
        }
    }
    // Tratamento para erros de validação (se não forem tratados antes)
    // O middleware de validação já deve tratar isso, mas como fallback:
    if (err.name === 'ValidationError') { // Supondo que express-validator possa lançar algo assim
        statusCode = 400;
        message = "Erro de validação nos dados enviados.";
        // Poderia incluir detalhes do erro se disponíveis em `err`
    }
    // TODO: Adicionar tratamento para outros tipos de erros específicos da aplicação
    // Ex: if (err instanceof AuthenticationError) { statusCode = 401; message = err.message; }
    // Ex: if (err instanceof AuthorizationError) { statusCode = 403; message = err.message; }
    // Garante que em produção não vaze detalhes do erro
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = "Ocorreu um erro inesperado. Tente novamente mais tarde.";
    }
    res.status(statusCode).json(Object.assign({ status: statusCode >= 500 ? 'error' : 'fail', message: message }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
};
exports.errorMiddleware = errorMiddleware;
