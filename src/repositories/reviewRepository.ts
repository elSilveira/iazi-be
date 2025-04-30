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

  // Atualizar a entidade correspondente explicitamente
  try {
    if (entityType === 'company') {
      await tx.company.update({
        where: { id: entityId },
        data: {
          rating: newRating,
          totalReviews: newTotalReviews,
        },
      });
    } else if (entityType === 'professional') {
      await tx.professional.update({
        where: { id: entityId },
        data: {
          rating: newRating,
          totalReviews: newTotalReviews,
        },
      });
    } else if (entityType === 'service') {
      // TODO: Adicionar rating/totalReviews ao modelo Service se necessário
      // await tx.service.update({
      //   where: { id: entityId },
      //   data: {
      //     rating: newRating,
      //     totalReviews: newTotalReviews,
      //   },
      // });
      console.warn("Rating update for Service not implemented yet.");
    }
  } catch (e) {
      console.error(`Erro ao atualizar rating para ${entityType} ${entityId}:`, e);
      // Consider re-throwing if it's an unexpected error
  }
}

export const reviewRepository = {
  // Encontrar múltiplas avaliações com base em filtros
  async findMany(filters: Prisma.ReviewWhereInput): Promise<Review[]> {
    return prisma.review.findMany({
      where: filters,
      include: { 
        user: { select: { id: true, name: true, avatar: true } } // Incluir dados do usuário
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Encontrar avaliações por serviço
  async findByService(serviceId: string): Promise<Review[]> {
    return this.findMany({ serviceId }); // Reutilizar findMany
  },

  // Encontrar avaliações por profissional
  async findByProfessional(professionalId: string): Promise<Review[]> {
    return this.findMany({ professionalId }); // Reutilizar findMany
  },

  // Encontrar avaliações por empresa
  async findByCompany(companyId: string): Promise<Review[]> {
    return this.findMany({ companyId }); // Reutilizar findMany
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
      const newReview = await tx.review.create({
        data,
      });

      const entityId = newReview.companyId ?? newReview.professionalId ?? newReview.serviceId;
      const entityType = newReview.companyId ? 'company' : newReview.professionalId ? 'professional' : 'service';

      if (entityId) {
        await updateAverageRating(tx, entityType, entityId);
      }

      return newReview;
    });
  },

  async update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        const oldReview = await tx.review.findUnique({ where: { id } });
        if (!oldReview) return null;

        const updatedReview = await tx.review.update({
          where: { id },
          data,
        });

        const entityId = updatedReview.companyId ?? updatedReview.professionalId ?? updatedReview.serviceId;
        const entityType = updatedReview.companyId ? 'company' : updatedReview.professionalId ? 'professional' : 'service';

        if (entityId) {
          await updateAverageRating(tx, entityType, entityId);
        }

        return updatedReview;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Review | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        const reviewToDelete = await tx.review.findUnique({ where: { id } });
        if (!reviewToDelete) return null;

        await tx.review.delete({
          where: { id },
        });

        const entityId = reviewToDelete.companyId ?? reviewToDelete.professionalId ?? reviewToDelete.serviceId;
        const entityType = reviewToDelete.companyId ? 'company' : reviewToDelete.professionalId ? 'professional' : 'service';

        if (entityId) {
          await updateAverageRating(tx, entityType, entityId);
        }

        return reviewToDelete;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  },
};

