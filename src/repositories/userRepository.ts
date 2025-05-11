import { prisma } from "../lib/prisma";
import { Prisma, User } from "@prisma/client"; // Revertido: Importar de @prisma/client

export const userRepository = {
  async findByEmail(email: string): Promise<User & { professional: { id: string } | null } | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        professional: { select: { id: true } },
      },
    });
  },

  async findById(id: string): Promise<(User & { professional: { id: string } | null }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { professional: { select: { id: true } } },
    });
  },

  async findBySlug(slug: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { slug },
    });
  },

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  },

  async hasCompany(userId: string): Promise<boolean> {
    const company = await prisma.company.findFirst({ where: { professionals: { some: { userId } } } });
    return !!company;
  },

  async isCompanyOwner(userId: string): Promise<boolean> {
    const company = await prisma.company.findFirst({ where: { professionals: { some: { userId } }, /* add ownerId if your schema supports it */ } });
    return !!company;
  },

  // Adicionar outros métodos conforme necessário (update, delete, etc.)
};
