import { prisma } from "../lib/prisma";
import { Prisma, Service } from "@prisma/client"; // Revertido: Importar de @prisma/client

export const serviceRepository = {
  async getAll(companyId?: string): Promise<Service[]> {
    return prisma.service.findMany({
      where: companyId ? { companyId } : {},
    });
  },

  async findById(id: string): Promise<Service | null> {
    return prisma.service.findUnique({
      where: { id },
    });
  },

  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    return prisma.service.create({
      data,
    });
  },

  async update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service | null> {
    try {
      return await prisma.service.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Service | null> {
    try {
      // Considerar desconectar de ProfessionalService antes de deletar
      await prisma.professionalService.deleteMany({ where: { serviceId: id } });
      return await prisma.service.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  },
};
