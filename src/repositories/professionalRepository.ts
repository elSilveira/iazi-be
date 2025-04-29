import { prisma } from "../lib/prisma";
import { Prisma, Professional } from "@prisma/client"; // Revertido: Importar de @prisma/client

export const professionalRepository = {
  async getAll(companyId?: string): Promise<Professional[]> {
    return prisma.professional.findMany({
      where: companyId ? { companyId } : {},
      include: { services: { include: { service: true } } }, // Incluir serviços associados
    });
  },

  async findById(id: string): Promise<Professional | null> {
    return prisma.professional.findUnique({
      where: { id },
      include: { services: { include: { service: true } } }, // Incluir serviços associados
    });
  },

  async create(data: Prisma.ProfessionalCreateInput): Promise<Professional> {
    // A conexão com serviços (ProfessionalService) deve ser tratada separadamente
    return prisma.professional.create({
      data,
    });
  },

  async update(id: string, data: Prisma.ProfessionalUpdateInput): Promise<Professional | null> {
    // A atualização da conexão com serviços deve ser tratada separadamente
    try {
      return await prisma.professional.update({
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

  async delete(id: string): Promise<Professional | null> {
    try {
      // Desconectar de ProfessionalService antes de deletar
      await prisma.professionalService.deleteMany({ where: { professionalId: id } });
      // Considerar o que fazer com agendamentos e avaliações associados
      // await prisma.appointment.updateMany({ where: { professionalId: id }, data: { professionalId: null } }); // Exemplo: Desassociar
      // await prisma.review.updateMany({ where: { professionalId: id }, data: { professionalId: null } }); // Exemplo: Desassociar
      return await prisma.professional.delete({
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
