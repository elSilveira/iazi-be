import { prisma } from "../lib/prisma";
import { Prisma, Professional } from "@prisma/client";

export const professionalRepository = {
  async findById(id: string): Promise<Professional | null> {
    return prisma.professional.findUnique({
      where: { id },
      include: { 
        company: true, 
        services: { include: { service: true } }, // Incluir serviços que o profissional oferece
        scheduledAppointments: true, 
        reviews: true 
      }, // Incluir relações
    });
  },

  async getAll(companyId?: string): Promise<Professional[]> {
    return prisma.professional.findMany({
      where: companyId ? { companyId } : undefined,
      include: { company: true }, // Incluir empresa na listagem geral
    });
  },

  async create(data: Prisma.ProfessionalCreateInput): Promise<Professional> {
    // A criação de relações (como conectar a serviços) pode precisar de tratamento especial.
    return prisma.professional.create({
      data,
    });
    // TODO: Implementar lógica para conectar a serviços (ProfessionalService)
  },

  async update(id: string, data: Prisma.ProfessionalUpdateInput): Promise<Professional | null> {
    return prisma.professional.update({
      where: { id },
      data,
    });
    // TODO: Implementar lógica para atualizar/conectar relações
  },

  async delete(id: string): Promise<Professional | null> {
    // A exclusão em cascata está configurada no schema.
    return prisma.professional.delete({
      where: { id },
    });
  },

  // Adicionar outras funções conforme necessário
};
