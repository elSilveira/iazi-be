import { prisma } from "../lib/prisma";
import { Prisma, Professional } from "@prisma/client";

export const professionalRepository = {
  // Método antigo, pode ser removido ou mantido
  async getAll(companyId?: string): Promise<Professional[]> {
    return prisma.professional.findMany({
      where: companyId ? { companyId } : {},
      include: { 
        services: { include: { service: true } },
        company: { include: { address: true } } // Incluir empresa e endereço
      }, 
    });
  },

  // Novo método findMany com filtros, ordenação e paginação
  async findMany(
    filters: Prisma.ProfessionalWhereInput,
    orderBy: Prisma.ProfessionalOrderByWithRelationInput,
    skip: number,
    take: number
  ): Promise<Professional[]> {
    return prisma.professional.findMany({
      where: filters,
      orderBy: orderBy,
      skip: skip,
      take: take,
      include: { 
        services: { include: { service: true } }, // Incluir serviços associados
        company: { include: { address: true } } // Incluir empresa e endereço
      } 
    });
  },

  // Novo método count com filtros
  async count(filters: Prisma.ProfessionalWhereInput): Promise<number> {
    return prisma.professional.count({
      where: filters,
    });
  },

  async findById(id: string): Promise<Professional | null> {
    return prisma.professional.findUnique({
      where: { id },
      include: { 
        services: { include: { service: true } }, // Incluir serviços associados
        company: { include: { address: true } } // Incluir empresa e endereço
      }, 
    });
  },

  async create(data: Prisma.ProfessionalCreateInput, serviceIds?: string[]): Promise<Professional> {
    return prisma.$transaction(async (tx) => {
      const newProfessional = await tx.professional.create({
        data,
      });

      if (serviceIds && serviceIds.length > 0) {
        const serviceConnections = serviceIds.map((serviceId) => ({
          professionalId: newProfessional.id,
          serviceId: serviceId,
        }));
        await tx.professionalService.createMany({
          data: serviceConnections,
          skipDuplicates: true, 
        });
      }

      return tx.professional.findUniqueOrThrow({
        where: { id: newProfessional.id },
        include: { services: { include: { service: true } } },
      });
    });
  },

  async update(id: string, data: Prisma.ProfessionalUpdateInput, serviceIds?: string[]): Promise<Professional> {
    // Prisma update throws P2025 if record not found
    return prisma.$transaction(async (tx) => {
      const updatedProfessional = await tx.professional.update({
        where: { id },
        data,
      });

      if (serviceIds !== undefined) {
        await tx.professionalService.deleteMany({
          where: { professionalId: id },
        });

        if (serviceIds.length > 0) {
          const serviceConnections = serviceIds.map((serviceId) => ({
            professionalId: id,
            serviceId: serviceId,
          }));
          await tx.professionalService.createMany({
            data: serviceConnections,
            skipDuplicates: true,
          });
        }
      }

      return tx.professional.findUniqueOrThrow({
        where: { id: updatedProfessional.id },
        include: { services: { include: { service: true } } },
      });
    });
  },

  async delete(id: string): Promise<Professional> {
    // Prisma delete throws P2025 if record not found
    return prisma.$transaction(async (tx) => {
      await tx.professionalService.deleteMany({ where: { professionalId: id } });
      // onDelete: SetNull for appointments should be handled by schema
      await tx.review.updateMany({ 
        where: { professionalId: id }, 
        data: { professionalId: null } 
      });

      const deletedProfessional = await tx.professional.delete({
        where: { id },
      });
      return deletedProfessional;
    });
  },
};

