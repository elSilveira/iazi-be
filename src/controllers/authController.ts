import { Request, Response } from "express";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret"; // Use uma variável de ambiente!

// Helper function for email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^"]+@[^"]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Função auxiliar para tratamento de erros
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      // Unique constraint violation
      if (message.includes("registro")) {
        return res.status(409).json({ message: "Email já cadastrado." });
      }
      return res.status(409).json({ message: "Erro de conflito (possível duplicidade)." });
    }
    // Adicionar outros códigos de erro do Prisma conforme necessário
  }
  // Erro genérico
  return res.status(500).json({ message: "Erro interno do servidor" });
};

// Função de Login
export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }
  // Adicionar validação de formato de email no login também?
  // if (!isValidEmail(email)) {
  //   return res.status(400).json({ message: "Formato de email inválido." });
  // }

  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({ 
      message: "Login bem-sucedido", 
      token, 
      user: userWithoutPassword 
    });

  } catch (error) {
    return handleError(res, error, "Erro no login:");
  }
};

// Função de Registro
export const register = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, name, avatar } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, senha e nome são obrigatórios" });
  }

  // Validar formato do email
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Formato de email inválido." });
  }
  
  // TODO: Adicionar validação de força da senha (ex: mínimo de caracteres)

  try {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email já cadastrado" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
      name,
      avatar,
    };
    const newUser = await userRepository.create(userData);

    const { password: _, ...userWithoutPassword } = newUser;

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(201).json({ 
      message: "Usuário registrado com sucesso", 
      token,
      user: userWithoutPassword 
    });

  } catch (error) {
    return handleError(res, error, "Erro no registro:");
  }
};
