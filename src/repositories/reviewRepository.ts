import { prisma } from "../lib/prisma";
import { Prisma, Review } from "@prisma/client";

export const reviewRepository = {
  async findById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
      include: { 
        user: true, 
        service: true, 
        professional: true, 
        company: true 
      }, // Incluir relações
    });
  },

  async findByService(serviceId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { serviceId },
      include: { user: true }, // Incluir usuário que fez a avaliação
      orderBy: {
        createdAt: 'desc', // Ordenar por mais recente
      },
    });
  },

  async findByProfessional(professionalId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { professionalId },
      include: { user: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async findByCompany(companyId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { companyId },
      include: { user: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async create(data: Prisma.ReviewCreateInput): Promise<Review> {
    // A criação requer que pelo menos um dos IDs (serviceId, professionalId, companyId) seja fornecido,
    // dependendo do que está sendo avaliado.
    return prisma.review.create({
      data,
    });
    // TODO: Adicionar lógica para atualizar a média de rating na entidade relacionada (Service, Professional, Company)
  },

  async update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review | null> {
    return prisma.review.update({
      where: { id },
      data,
    });
    // TODO: Adicionar lógica para recalcular a média de rating na entidade relacionada
  },

  async delete(id: string): Promise<Review | null> {
    // Antes de deletar, pode ser necessário recalcular a média de rating.
    // TODO: Adicionar lógica para recalcular a média de rating na entidade relacionada
    return prisma.review.delete({
      where: { id },
    });
  },

  // Adicionar outras funções conforme necessário
};
