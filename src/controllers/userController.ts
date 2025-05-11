import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/userRepository";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../utils/prismaClient"; // Corrected import path
import { getUserActivityFeed } from "../services/activityLogService"; // Import activity feed service

// Extend Request to include user property from authMiddleware
// interface AuthRequest extends Request { // Removed, using global declaration
//   user?: { id: string };
// }

// Get current user profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const { password, professional, ...userProfile } = user;
    // Check roles/relations
    const isProfessional = !!professional;
    const hasCompany = await userRepository.hasCompany(userId);
    const isAdmin = user.role === 'ADMIN';
    res.json({
      ...userProfile,
      professionalId: professional ? professional.id : null,
      isProfessional,
      hasCompany,
      isAdmin
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  const { name, email, avatar, password, bio, phone } = req.body; // Added bio and phone

  if (!userId) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }

  try {
    const updateData: Prisma.UserUpdateInput = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        res.status(409).json({ message: "Email já está em uso por outra conta." });
        return;
      }
      updateData.email = email;
    }
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio; // Added bio update
    if (phone !== undefined) updateData.phone = phone; // Added phone update
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

// Get current user's activity feed
export const getUserFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    const { page = '1', pageSize = '10' } = req.query;

    if (!userId) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(pageSizeNum) || pageSizeNum < 1) {
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e pageSize devem ser números positivos)." });
        return;
    }

    try {
        const feedData = await getUserActivityFeed(userId, pageNum, pageSizeNum);
        res.json(feedData);
    } catch (error) {
        console.error("Error fetching user activity feed:", error);
        next(error); // Pass error to the central error handler
    }
};

