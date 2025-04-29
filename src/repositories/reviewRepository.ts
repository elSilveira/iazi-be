import { prisma } from "../lib/prisma";
import { Prisma, Review } from "@prisma/client"; // Revertido: Importar de @prisma/client

export const reviewRepository = {
  // Encontrar avaliações por serviço
  async findByService(serviceId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { serviceId },
      include: { 
        user: { select: { id: true, name: true, avatar: true } } // Incluir dados do usuário
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Encontrar avaliações por profissional
  async findByProfessional(professionalId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { professionalId },
      include: { 
        user: { select: { id: true, name: true, avatar: true } } 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Encontrar avaliações por empresa
  async findByCompany(companyId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { companyId },
      include: { 
        user: { select: { id: true, name: true, avatar: true } } 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async findById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
      include: { 
        user: { select: { id: true, name: true, avatar: true } } 
      },
    });
  },

  async create(data: Prisma.ReviewCreateInput): Promise<Review> {
    return prisma.review.create({
      data,
    });
  },

  async update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review | null> {
    try {
      return await prisma.review.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Avaliação não encontrada
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Review | null> {
    try {
      return await prisma.review.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Avaliação não encontrada
      }
      throw error;
    }
  },
};
