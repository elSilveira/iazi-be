import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Estender a interface Request do Express para incluir a propriedade user
interface AuthRequest extends Request {
  user?: { id: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Usar res.status().json() e retornar explicitamente para evitar chamar next()
    res.status(401).json({ message: "Token de autenticação não fornecido ou inválido." });
    return; 
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("Erro crítico: JWT_SECRET não definido no ambiente.");
    // Usar res.status().json() e retornar explicitamente
    res.status(500).json({ message: "Erro interno do servidor." });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    // Anexar o ID do usuário decodificado ao objeto req para uso posterior
    req.user = { id: decoded.userId }; 
    next(); // Chamar next() apenas se o token for válido
  } catch (error) {
    // Tratar erros específicos do JWT
    if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: "Token expirado." });
    } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: "Token inválido." });
    } else {
        // Tratar outros erros inesperados
        console.error("Erro ao verificar token:", error);
        res.status(500).json({ message: "Erro interno ao processar token." });
    }
    // Não chamar next() em caso de erro
    return; 
  }
};

