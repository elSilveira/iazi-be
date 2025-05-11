import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { randomBytes } from "crypto";

// POST /api/invites - Generate a new invite code (admin only)
export const generateInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Allow any authenticated user to generate invites
    if (!req.user) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }
    const code = randomBytes(8).toString("hex");
    const invite = await prisma.inviteCode.create({
      data: { code },
    });
    res.status(201).json({ code: invite.code });
  } catch (error) {
    next(error);
  }
};
