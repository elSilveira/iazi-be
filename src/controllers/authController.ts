import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken"; // Import Secret and SignOptions types
import { Prisma } from "@prisma/client";
import { gamificationService, GamificationEventType } from "../services/gamificationService"; // Import gamification service and event types

// Carregar segredos e configurações de forma segura das variáveis de ambiente
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || "15m"; // Default 15m
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || "7d"; // Default 7d

if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  console.error("ERRO FATAL: Variáveis de ambiente JWT_SECRET ou REFRESH_TOKEN_SECRET não definidas.");
  process.exit(1); // Encerrar se as chaves não estiverem definidas
}

// Helper function for email validation (pode ser movida para utils)
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^"]+@[^"]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Helper to generate a URL-friendly slug from a name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function generateUniqueUserSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 1;
  let unique = false;
  while (!unique) {
    const existing = await userRepository.findBySlug(slug);
    if (!existing) {
      unique = true;
    } else {
      slug = `${slugify(base)}-${suffix++}`;
    }
  }
  return slug;
}

// Função de Login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
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

    // Definir opções de assinatura explicitamente (usando 'as any' para contornar o erro de tipo)
    const accessTokenOptions: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRATION as any };
    const refreshTokenOptions: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRATION as any };

    // Gerar Access Token
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, accessTokenOptions);

    // Gerar Refresh Token
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, refreshTokenOptions);

    // TODO: Consider storing the refresh token securely (e.g., in DB or Redis) for better revocation control

    const { password: _, ...userWithoutPassword } = user;

    // Compose user/me-like payload
    const isProfessional = !!user.professional;
    const hasCompany = await userRepository.hasCompany(user.id);
    const isAdmin = user.role === 'ADMIN';
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
      slug: user.slug,
      role: user.role,
      professionalId: user.professional ? user.professional.id : null,
      isProfessional,
      hasCompany,
      isAdmin,
      accessToken,
      refreshToken
    });

  } catch (error) {
    next(error);
  }
};

// Função de Registro
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password, name, avatar } = req.body;

  try {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error: any = new Error("Email já cadastrado");
      error.statusCode = 409; // Conflict
      return next(error);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const slug = await generateUniqueUserSlug(name);

    const userData: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
      name,
      avatar,
      slug,
    };
    const newUser = await userRepository.create(userData);

    // --- GAMIFICATION INTEGRATION START ---
    // Trigger USER_REGISTERED event after successful creation
    // Run this asynchronously, don't block the registration response
    gamificationService.triggerEvent(newUser.id, GamificationEventType.USER_REGISTERED)
      .catch(err => console.error("Gamification event trigger failed for USER_REGISTERED:", err));
    // --- GAMIFICATION INTEGRATION END ---

    const { password: _, ...userWithoutPassword } = newUser;

    // Definir opções de assinatura explicitamente (usando 'as any' para contornar o erro de tipo)
    const accessTokenOptions: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRATION as any };
    const refreshTokenOptions: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRATION as any };

    // Gerar Access Token
    const accessToken = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, accessTokenOptions);

    // Gerar Refresh Token
    const refreshToken = jwt.sign({ userId: newUser.id }, REFRESH_TOKEN_SECRET, refreshTokenOptions);

    // TODO: Consider storing the refresh token securely

    res.status(201).json({ 
      message: "Usuário registrado com sucesso", 
      accessToken,
      refreshToken, // Retornar o refresh token
      user: userWithoutPassword 
    });

  } catch (error) {
    next(error);
  }
};

// Função para Refresh Token (Nova)
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { token } = req.body; // Espera o refresh token no corpo da requisição

  if (!token) {
    const error: any = new Error("Refresh token não fornecido");
    error.statusCode = 400; // Bad Request
    return next(error);
  }

  try {
    // Verificar o refresh token
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };

    // TODO: Add check if refresh token is revoked (if stored)

    // Definir opções de assinatura explicitamente (usando 'as any' para contornar o erro de tipo)
    const accessTokenOptions: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRATION as any };

    // Gerar um novo access token
    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, accessTokenOptions);

    res.json({ 
      message: "Access token atualizado com sucesso",
      accessToken 
    });

  } catch (error) {
    // Se a verificação falhar (token inválido, expirado, etc.)
    const err: any = new Error("Refresh token inválido ou expirado");
    err.statusCode = 401; // Unauthorized
    next(err);
  }
};

