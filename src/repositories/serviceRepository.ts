import { prisma } from "../lib/prisma";
import { Prisma, Service } from "@prisma/client";

export const serviceRepository = {
  async findById(id: string): Promise<Service | null> {
    return prisma.service.findUnique({
      where: { id },
      include: { 
        company: true, 
        professionals: { include: { professional: true } }, // Incluir profissionais que oferecem o serviço
        appointments: true, 
        reviews: true 
      }, // Incluir relações
    });
  },

  async getAll(companyId?: string): Promise<Service[]> {
    return prisma.service.findMany({
      where: companyId ? { companyId } : undefined,
      include: { company: true }, // Incluir empresa na listagem geral
    });
  },

  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    // A criação de relações (como conectar a profissionais) pode precisar de tratamento especial.
    return prisma.service.create({
      data,
    });
    // TODO: Implementar lógica para conectar a profissionais (ProfessionalService)
  },

  async update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service | null> {
    return prisma.service.update({
      where: { id },
      data,
    });
    // TODO: Implementar lógica para atualizar/conectar relações
  },

  async delete(id: string): Promise<Service | null> {
    // A exclusão em cascata está configurada no schema.
    return prisma.service.delete({
      where: { id },
    });
  },

  // Adicionar outras funções conforme necessário (ex: buscar por categoria)
};
