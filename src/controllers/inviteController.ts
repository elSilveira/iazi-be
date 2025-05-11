import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { randomBytes } from "crypto";

// POST /api/invites - Generate a new invite code (admin only)
export const generateInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only allow admin users to generate invites
    if (!req.user || req.user.role !== "ADMIN") {
      res.status(403).json({ message: "Apenas administradores podem gerar convites." });
      return;
    }
    // Generate a random code
    const code = randomBytes(8).toString("hex");
    const invite = await prisma.inviteCode.create({
      data: { code },
    });
    res.status(201).json({ code: invite.code });
  } catch (error) {
    next(error);
  }
};
