import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import logger from "../utils/logger"; // Import the configured Winston logger

// Interface para um erro com status code (opcional)
interface AppError extends Error {
  statusCode?: number;
  // Add other potential error properties if needed
}

/**
 * Middleware global para tratamento de erros.
 * Captura erros passados por next(error) ou lançados em rotas assíncronas.
 * Utiliza o logger Winston para registrar detalhes do erro.
 */
export const errorMiddleware = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  // Log the error using Winston
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    name: err.name,
    stack: err.stack,
    // Optionally add request body or user info if safe and relevant
    // requestBody: req.body, 
    // userId: req.user?.id 
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || "Erro interno do servidor";
  let status = statusCode >= 500 ? "error" : "fail";

  // Tratamento específico para erros do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = "fail"; // Prisma errors are usually client/request related (4xx)
    switch (err.code) {
      case "P2002":
        const target = err.meta?.target as string[] | undefined;
        message = `Violação de restrição única: O valor fornecido para ${target ? target.join(", ") : "campo(s)"} já existe.`;
        statusCode = 409; // Conflict
        break;
      case "P2025":
        message = "Recurso não encontrado. O registro que você tentou operar não existe.";
        statusCode = 404; // Not Found
        break;
      case "P2003":
        const fieldName = err.meta?.field_name as string | undefined;
        message = `Falha na restrição de chave estrangeira no campo: ${fieldName || "desconhecido"}. O registro relacionado não existe.`;
        statusCode = 400; // Bad Request (or 409 Conflict depending on context)
        break;
      // Add more specific Prisma error codes as needed
      default:
        logger.warn(`Unhandled Prisma Error Code: ${err.code}`);
        message = "Ocorreu um erro ao processar sua solicitação no banco de dados.";
        statusCode = 500;
        status = "error";
        break;
    }
  }

  // Tratamento para erros de validação (ex: class-validator)
  // Assuming validation errors might have a different structure
  if (err.name === "ValidationError" || (Array.isArray((err as any).errors) && (err as any).errors.length > 0)) {
      statusCode = 400;
      status = "fail";
      // Attempt to create a more informative message from validation errors
      try {
          const validationErrors = (err as any).errors.map((e: any) => Object.values(e.constraints)).flat();
          message = `Erro de validação: ${validationErrors.join(", ")}`;
      } catch {
          message = "Erro de validação nos dados enviados.";
      }
  }

  // TODO: Add specific handling for custom application errors
  // Example:
  // if (err instanceof AuthenticationError) {
  //   statusCode = 401;
  //   status = "fail";
  //   message = err.message;
  // }
  // if (err instanceof AuthorizationError) {
  //   statusCode = 403;
  //   status = "fail";
  //   message = err.message;
  // }

  // Generic message for 500 errors in production to avoid leaking details
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Ocorreu um erro inesperado em nossos servidores. Por favor, tente novamente mais tarde.";
  }

  // Send standardized JSON response
  res.status(statusCode).json({
    status: status,
    message: message,
    // Only include stack trace in development environment for debugging
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    // Optionally include error code or name in development
    ...(process.env.NODE_ENV === "development" && { errorName: err.name, errorCode: (err as any).code }),
  });
};

