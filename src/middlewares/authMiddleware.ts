import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/userRepository"; // Importar o repositório de usuário

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Tornar a função async
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token de autenticação não fornecido ou inválido." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("Erro crítico: JWT_SECRET não definido no ambiente.");
    res.status(500).json({ message: "Erro interno do servidor." });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // Buscar o usuário no banco de dados para obter o role
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: "Usuário associado ao token não encontrado." });
      return;
    }

    // Anexar o ID e o role do usuário ao objeto req
    req.user = { id: user.id, role: user.role }; 
    next(); // Chamar next() apenas se o token for válido e o usuário encontrado
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: "Token expirado." });
    } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: "Token inválido." });
    } else {
        console.error("Erro ao verificar token ou buscar usuário:", error);
        res.status(500).json({ message: "Erro interno ao processar token." });
    }
    return;
  }
};

