import { prisma } from "../lib/prisma";
import { Prisma, User } from "@prisma/client"; // Revertido: Importar de @prisma/client

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  },

  // Adicionar outros métodos conforme necessário (update, delete, etc.)
};
