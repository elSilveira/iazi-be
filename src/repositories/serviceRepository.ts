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

  // Método findMany com filtros, ordenação, paginação e relações completas
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
        category: true, // Include category data
        company: { // Include basic company data
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        professionals: { // Include professionals linked to this service
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                role: true,
                rating: true,
                image: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    address: true
                  }
                },
                services: { // Include ALL services for each professional
                  include: {
                    service: { // Include the full service object for each professional service
                      include: {
                        category: true, // Include category for each service
                        company: {
                          select: {
                            id: true,
                            name: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
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

  async findWithProfessionals(): Promise<Service[]> {
    try {
      return prisma.service.findMany({
        where: {
          // Ensure there is at least one professional linked to this service
          professionals: {
            some: {}
          }
        },
        include: {
          professionals: { 
            include: { 
              professional: {
                include: {
                  company: true, // Include company data for professionals
                  services: {   // Include all services offered by this professional
                    include: {
                      service: {
                        include: {
                          category: true // Include category data for other services
                        }
                      }
                    }
                  }
                }
              } 
            }
          },
          category: true,
          company: true,
        },
      });
    } catch (error) {
      console.error('Error fetching services with professionals:', error);
      throw new Error('Failed to fetch services with their professionals');
    }
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

  // Link a professional to a service (with price, schedule, description)
  async linkProfessionalToService(professionalId: string, serviceId: string, price?: string, schedule?: string, description?: string): Promise<void> {
    await prisma.professionalService.create({
      data: { professionalId, serviceId, price, schedule, description },
    });
  },

  // Unlink a professional from a service
  async unlinkProfessionalFromService(professionalId: string, serviceId: string): Promise<void> {
    await prisma.professionalService.delete({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
  },

  // List all professionals linked to a service
  async getProfessionalsByService(serviceId: string) {
    return prisma.professionalService.findMany({
      where: { serviceId },
      include: { professional: true },
    });
  },

  // List all services linked to a professional (include join fields)
  async getServicesByProfessional(professionalId: string) {
    return prisma.professionalService.findMany({
      where: { professionalId },
      include: { service: true },
    });
  },
};

