import { prisma } from "../lib/prisma";
import { Prisma, Professional } from "@prisma/client";

// Define the type for Professional with included relations
export type ProfessionalWithDetails = Prisma.ProfessionalGetPayload<{
  include: {
    services: { include: { service: true } };
    company: { include: { address: true } };
  };
}>;

export const professionalRepository = {
  // Define the include object for consistency
  includeDetails: {
    services: { include: { service: true } },
    company: { include: { address: true } },
  } as const,

  // Método antigo, pode ser removido ou mantido
  async getAll(companyId?: string): Promise<ProfessionalWithDetails[]> {
    return prisma.professional.findMany({
      where: companyId ? { companyId } : {},
      include: this.includeDetails,
    });
  },

  // Novo método findMany com filtros, ordenação e paginação
  async findMany(
    filters: Prisma.ProfessionalWhereInput,
    orderBy: Prisma.ProfessionalOrderByWithRelationInput,
    skip: number,
    take: number
  ): Promise<ProfessionalWithDetails[]> {
    return prisma.professional.findMany({
      where: filters,
      orderBy: orderBy,
      skip: skip,
      take: take,
      include: this.includeDetails,
    });
  },

  // Novo método count com filtros
  async count(filters: Prisma.ProfessionalWhereInput): Promise<number> {
    return prisma.professional.count({
      where: filters,
    });
  },

  async findById(id: string): Promise<ProfessionalWithDetails | null> {
    return prisma.professional.findUnique({
      where: { id },
      include: this.includeDetails,
    });
  },

  async create(data: Prisma.ProfessionalCreateInput, serviceIds?: string[]): Promise<ProfessionalWithDetails> {
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

      // Re-fetch with includes
      return tx.professional.findUniqueOrThrow({
        where: { id: newProfessional.id },
        include: this.includeDetails,
      });
    });
  },

  async update(id: string, data: Prisma.ProfessionalUpdateInput, serviceIds?: string[]): Promise<ProfessionalWithDetails> {
    // Prisma update throws P2025 if record not found
    return prisma.$transaction(async (tx) => {
      const updatedProfessional = await tx.professional.update({
        where: { id },
        data,
        // Include details directly in update if possible, otherwise re-fetch
        // include: this.includeDetails, // Include might not work directly with serviceIds logic
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

      // Re-fetch with includes
      return tx.professional.findUniqueOrThrow({
        where: { id: updatedProfessional.id },
        include: this.includeDetails,
      });
    });
  },

  async delete(id: string): Promise<Professional> { // Return type is just Professional here
    // Prisma delete throws P2025 if record not found
    return prisma.$transaction(async (tx) => {
      // Fetch before deleting to potentially return details (optional)
      // const professionalToDelete = await tx.professional.findUnique({ 
      //     where: { id }, 
      //     include: this.includeDetails 
      // });
      // if (!professionalToDelete) throw new Prisma.PrismaClientKnownRequestError("Professional not found", { code: "P2025", clientVersion: "" });

      await tx.professionalService.deleteMany({ where: { professionalId: id } });
      // onDelete: SetNull for appointments should be handled by schema
      await tx.review.updateMany({ 
        where: { professionalId: id }, 
        data: { professionalId: null } 
      });

      const deletedProfessional = await tx.professional.delete({
        where: { id },
      });
      return deletedProfessional; // Return the basic deleted object
      // return professionalToDelete; // Or return the object with details fetched before delete
    });
  },
};

