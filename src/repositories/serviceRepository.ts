import { prisma } from "../lib/prisma";
import { Prisma, Service } from "@prisma/client";

export const serviceRepository = {
  // Método antigo, pode ser removido ou mantido para compatibilidade se necessário
  async getAll(companyId?: string): Promise<Service[]> {
    return prisma.service.findMany({
      where: companyId ? { companyId } : {},
      include: { category: true } // Incluir categoria por padrão?
    });
  },

  // Novo método findMany com filtros, ordenação e paginação
  async findMany(
    filters: Prisma.ServiceWhereInput,
    orderBy: Prisma.ServiceOrderByWithRelationInput,
    skip: number,
    take: number
  ): Promise<Service[]> {
    return prisma.service.findMany({
      where: filters,
      orderBy: orderBy,
      skip: skip,
      take: take,
      include: { 
        category: true, // Incluir dados da categoria
        company: { // Incluir dados básicos da empresa
          select: {
            id: true,
            name: true,
            address: true // Incluir endereço da empresa
          }
        }
      } 
    });
  },

  // Novo método count com filtros
  async count(filters: Prisma.ServiceWhereInput): Promise<number> {
    return prisma.service.count({
      where: filters,
    });
  },

  async findById(id: string): Promise<Service | null> {
    return prisma.service.findUnique({
      where: { id },
      include: { 
        category: true, 
        company: true, 
        professionals: { include: { professional: true } } // Incluir profissionais associados
      }
    });
  },

  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    // Remove 'company' property if it is not present or not needed
    const cleanData: any = { ...data };
    if (typeof cleanData.company === 'undefined') {
      delete cleanData.company;
    }
    // Do NOT add companyId at all for professionals (it is handled by the relation, not as a direct field)
    return prisma.service.create({
      data: cleanData,
    });
  },

  async update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service> {
    // O update do Prisma já lança P2025 se não encontrar, não precisa de try/catch aqui
    return prisma.service.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Service> {
     // O delete do Prisma já lança P2025 se não encontrar
     // A exclusão em cascata ou restrições FK devem ser tratadas no schema ou no controller
     // Desconectar relações many-to-many antes de deletar
     await prisma.professionalService.deleteMany({ where: { serviceId: id } });
     // TODO: Deletar Appointments e Reviews associados ou definir onDelete no schema?
     
     return prisma.service.delete({
       where: { id },
     });
  },
};

