import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

// Carregar a chave secreta de forma segura (idealmente de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("ERRO FATAL: Variável de ambiente JWT_SECRET não definida.");
  process.exit(1); // Encerrar se a chave não estiver definida
}

// Helper function for email validation (pode ser movida para utils)
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^"]+@[^"]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Função de Login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  // A validação básica de presença será feita pelo express-validator
  // A validação de formato de email também será feita pelo express-validator

  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Lançar um erro específico ou usar um erro genérico com status
      const error: any = new Error("Credenciais inválidas");
      error.statusCode = 401;
      return next(error);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error: any = new Error("Credenciais inválidas");
      error.statusCode = 401;
      return next(error);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h", // Aumentado para 24h, considerar refresh tokens
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({ 
      message: "Login bem-sucedido", 
      token, 
      user: userWithoutPassword 
    });

  } catch (error) {
    // Passa qualquer erro inesperado para o middleware global
    next(error);
  }
};

// Função de Registro
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password, name, avatar } = req.body;

  // A validação de presença e formato será feita pelo express-validator
  // A validação de força da senha pode ser adicionada no validator

  try {
    // A verificação de usuário existente pode ser tratada pelo erro P2002 do Prisma
    // Mas verificar antes pode dar uma mensagem de erro mais amigável
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error: any = new Error("Email já cadastrado");
      error.statusCode = 409; // Conflict
      return next(error);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
      name,
      avatar, // Prisma aceita null ou undefined para campos opcionais
    };
    const newUser = await userRepository.create(userData);

    const { password: _, ...userWithoutPassword } = newUser;

    // Gerar token após registro bem-sucedido
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({ 
      message: "Usuário registrado com sucesso", 
      token,
      user: userWithoutPassword 
    });

  } catch (error) {
    // Passa erros (incluindo P2002 do Prisma se a verificação acima falhar) para o middleware global
    next(error);
  }
};

