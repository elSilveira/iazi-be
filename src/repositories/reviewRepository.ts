import { prisma } from "../lib/prisma";
import { Prisma, Review, Company, Professional, Service } from "@prisma/client";

// Função auxiliar para calcular e atualizar a média de avaliação
async function updateAverageRating(
  tx: Prisma.TransactionClient, 
  entityType: 'company' | 'professional' | 'service',
  entityId: string
) {
  const aggregateResult = await tx.review.aggregate({
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
    where: {
      [`${entityType}Id`]: entityId,
    },
  });

  const newRating = aggregateResult._avg.rating ?? 0;
  const newTotalReviews = aggregateResult._count._all;

  // Atualizar a entidade correspondente
  await tx[entityType].update({
    where: { id: entityId },
    data: {
      rating: newRating,
      totalReviews: newTotalReviews,
    },
  });
}

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
    return prisma.$transaction(async (tx) => {
      // 1. Criar a avaliação
      const newReview = await tx.review.create({
        data,
      });

      // 2. Atualizar a média de avaliação da entidade relacionada
      if (newReview.companyId) {
        await updateAverageRating(tx, 'company', newReview.companyId);
      } else if (newReview.professionalId) {
        await updateAverageRating(tx, 'professional', newReview.professionalId);
      } else if (newReview.serviceId) {
        // TODO: Adicionar rating/totalReviews ao modelo Service se necessário
        // await updateAverageRating(tx, 'service', newReview.serviceId);
        console.warn("Rating update for Service not implemented yet.");
      }

      return newReview;
    });
  },

  async update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Buscar a avaliação *antes* de atualizar para saber a entidade antiga
        const oldReview = await tx.review.findUnique({ where: { id } });
        if (!oldReview) return null; // Avaliação não encontrada

        // 2. Atualizar a avaliação
        const updatedReview = await tx.review.update({
          where: { id },
          data,
        });

        // 3. Atualizar a média da entidade relacionada (a mesma entidade, pois não permitimos mudar a entidade associada)
        const entityId = updatedReview.companyId ?? updatedReview.professionalId ?? updatedReview.serviceId;
        const entityType = updatedReview.companyId ? 'company' : updatedReview.professionalId ? 'professional' : 'service';

        if (entityId && entityType !== 'service') { // Temporariamente ignorando service
          await updateAverageRating(tx, entityType, entityId);
        } else if (entityType === 'service') {
           console.warn("Rating update for Service not implemented yet.");
        }

        return updatedReview;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Avaliação não encontrada (já tratado na transação, mas por segurança)
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Review | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Buscar a avaliação *antes* de deletar para saber a entidade associada
        const reviewToDelete = await tx.review.findUnique({ where: { id } });
        if (!reviewToDelete) return null; // Avaliação não encontrada

        // 2. Deletar a avaliação
        await tx.review.delete({
          where: { id },
        });

        // 3. Atualizar a média da entidade relacionada
        const entityId = reviewToDelete.companyId ?? reviewToDelete.professionalId ?? reviewToDelete.serviceId;
        const entityType = reviewToDelete.companyId ? 'company' : reviewToDelete.professionalId ? 'professional' : 'service';

        if (entityId && entityType !== 'service') { // Temporariamente ignorando service
          await updateAverageRating(tx, entityType, entityId);
        } else if (entityType === 'service') {
           console.warn("Rating update for Service not implemented yet.");
        }

        return reviewToDelete; // Retorna a avaliação deletada
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Avaliação não encontrada
      }
      throw error;
    }
  },
};
