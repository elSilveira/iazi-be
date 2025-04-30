import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/userRepository";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

// Extend Request to include user property from authMiddleware
interface AuthRequest extends Request {
  user?: { id: string };
}

// Get current user profile
export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    // This should technically not happen if authMiddleware is working correctly
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }

  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      res.status(404).json({ message: "Perfil de usuário não encontrado." });
      return;
    }
    // Exclude password from the response
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    next(error);
  }
};

// Update current user profile
export const updateUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  const { name, email, avatar, password } = req.body;

  if (!userId) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }

  try {
    const updateData: Prisma.UserUpdateInput = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        res.status(409).json({ message: "Email já está em uso por outra conta." });
        return;
      }
      updateData.email = email;
    }
    if (avatar) updateData.avatar = avatar;
    if (password) {
      // Hash the new password if provided
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Exclude password from the response
    const { password: _, ...userProfile } = updatedUser;
    res.json({ message: "Perfil atualizado com sucesso.", user: userProfile });

  } catch (error) {
    // Handle potential Prisma errors (e.g., record not found)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: "Usuário não encontrado para atualização." });
      return;
    }
    next(error);
  }
};

