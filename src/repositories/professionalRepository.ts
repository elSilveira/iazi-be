import { prisma } from "../lib/prisma";
import { Prisma, Professional } from "@prisma/client";

// Define the type for Professional with included relations
export type ProfessionalWithDetails = Prisma.ProfessionalGetPayload<{
  include: {
    services: { include: { service: true } };
    company: { include: { address: true } };
    experiences: true; // Maps to ProfessionalExperience
    education: true;   // Maps to ProfessionalEducation
    availability: true; // Maps to ProfessionalAvailabilitySlot
    portfolio: true;    // Maps to ProfessionalPortfolioItem
  };
}>;

export const professionalRepository = {
  // Define the include object for consistency
  includeDetails: {
    services: { include: { service: true } },
    company: { include: { address: true } },
    experiences: true, // Maps to ProfessionalExperience model
    education: true,   // Correct: Prisma expects 'education' (singular)
    availability: true, // Maps to ProfessionalAvailabilitySlot model
    portfolio: true,    // Maps to ProfessionalPortfolioItem model
  } as const,

  async getAll(companyId?: string): Promise<ProfessionalWithDetails[]> {
    return prisma.professional.findMany({
      where: companyId ? { companyId } : {},
      include: this.includeDetails,
    });
  },

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

  async findByUserId(userId: string): Promise<ProfessionalWithDetails | null> {
    // Removed debug logs for production cleanliness
    return prisma.professional.findUnique({
      where: { userId },
      include: this.includeDetails,
    });
  },

  async create(
    data: Prisma.ProfessionalCreateInput,
    serviceIds?: string[],
    experiencesData?: Prisma.ProfessionalExperienceCreateWithoutProfessionalInput[],
    educationsData?: Prisma.ProfessionalEducationCreateWithoutProfessionalInput[],
    availabilityData?: Prisma.ProfessionalAvailabilitySlotCreateWithoutProfessionalInput[],
    portfolioData?: Prisma.ProfessionalPortfolioItemCreateWithoutProfessionalInput[]
  ): Promise<ProfessionalWithDetails> {
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

      if (experiencesData && experiencesData.length > 0) {
        await tx.professionalExperience.createMany({
          data: experiencesData.map(exp => ({ ...exp, professionalId: newProfessional.id })),
        });
      }

      if (educationsData && educationsData.length > 0) {
        await tx.professionalEducation.createMany({
          data: educationsData.map(edu => ({ ...edu, professionalId: newProfessional.id })),
        });
      }

      if (availabilityData && availabilityData.length > 0) {
        await tx.professionalAvailabilitySlot.createMany({
          data: availabilityData.map(slot => ({ ...slot, professionalId: newProfessional.id })),
        });
      }

      if (portfolioData && portfolioData.length > 0) {
        await tx.professionalPortfolioItem.createMany({
          data: portfolioData.map(item => ({ ...item, professionalId: newProfessional.id })),
        });
      }

      return tx.professional.findUniqueOrThrow({
        where: { id: newProfessional.id },
        include: this.includeDetails,
      });
    });
  },

  async update(
    id: string,
    data: Prisma.ProfessionalUpdateInput,
    serviceIds?: string[],
    experiencesData?: Prisma.ProfessionalExperienceCreateWithoutProfessionalInput[],
    educationsData?: Prisma.ProfessionalEducationCreateWithoutProfessionalInput[],
    availabilityData?: Prisma.ProfessionalAvailabilitySlotCreateWithoutProfessionalInput[],
    portfolioData?: Prisma.ProfessionalPortfolioItemCreateWithoutProfessionalInput[]
  ): Promise<ProfessionalWithDetails> {
    return prisma.$transaction(async (tx) => {
      const updatedProfessional = await tx.professional.update({
        where: { id },
        data,
      });

      if (serviceIds !== undefined) {
        await tx.professionalService.deleteMany({ where: { professionalId: id } });
        if (serviceIds.length > 0) {
          await tx.professionalService.createMany({
            data: serviceIds.map((serviceId) => ({ professionalId: id, serviceId: serviceId })),
            skipDuplicates: true,
          });
        }
      }

      if (experiencesData !== undefined) {
        await tx.professionalExperience.deleteMany({ where: { professionalId: id } });
        if (experiencesData.length > 0) {
          await tx.professionalExperience.createMany({
            data: experiencesData.map(exp => ({ ...exp, professionalId: id })),
          });
        }
      }

      if (educationsData !== undefined) {
        await tx.professionalEducation.deleteMany({ where: { professionalId: id } });
        if (educationsData.length > 0) {
          await tx.professionalEducation.createMany({
            data: educationsData.map(edu => ({ ...edu, professionalId: id })),
          });
        }
      }

      if (availabilityData !== undefined) {
        await tx.professionalAvailabilitySlot.deleteMany({ where: { professionalId: id } });
        if (availabilityData.length > 0) {
          await tx.professionalAvailabilitySlot.createMany({
            data: availabilityData.map(slot => ({ ...slot, professionalId: id })),
          });
        }
      }

      if (portfolioData !== undefined) {
        await tx.professionalPortfolioItem.deleteMany({ where: { professionalId: id } });
        if (portfolioData.length > 0) {
          await tx.professionalPortfolioItem.createMany({
            data: portfolioData.map(item => ({ ...item, professionalId: id })),
          });
        }
      }

      return tx.professional.findUniqueOrThrow({
        where: { id: updatedProfessional.id },
        include: this.includeDetails,
      });
    });
  },

  async delete(id: string): Promise<Professional> {
    return prisma.$transaction(async (tx) => {
      await tx.professionalService.deleteMany({ where: { professionalId: id } });
      await tx.professionalExperience.deleteMany({ where: { professionalId: id } });
      await tx.professionalEducation.deleteMany({ where: { professionalId: id } });
      await tx.professionalAvailabilitySlot.deleteMany({ where: { professionalId: id } });
      await tx.professionalPortfolioItem.deleteMany({ where: { professionalId: id } });
      await tx.review.updateMany({ 
        where: { professionalId: id }, 
        data: { professionalId: null } 
      });
      // Note: onDelete: Cascade for appointments and scheduleBlocks should be handled by schema if set
      // If not, they might need explicit deletion or update here.

      const deletedProfessional = await tx.professional.delete({
        where: { id },
      });
      return deletedProfessional;
    });
  },
};

