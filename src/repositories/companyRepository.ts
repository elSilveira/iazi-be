import { prisma } from "../lib/prisma";
import { Prisma, Company, Address } from "@prisma/client";

export const companyRepository = {
  // Método antigo, pode ser removido ou mantido
  async getAll(): Promise<Company[]> {
    return prisma.company.findMany({
      include: { address: true }, 
    });
  },

  // Novo método findMany com filtros, ordenação e paginação
  async findMany(
    filters: Prisma.CompanyWhereInput,
    orderBy: Prisma.CompanyOrderByWithRelationInput,
    skip: number,
    take: number
  ): Promise<Company[]> {
    return prisma.company.findMany({
      where: filters,
      orderBy: orderBy,
      skip: skip,
      take: take,
      include: { 
        address: true, // Incluir endereço
        // services: { select: { id: true, name: true } }, // Incluir serviços (opcional)
        // professionals: { select: { id: true, name: true } } // Incluir profissionais (opcional)
      } 
    });
  },

  // Novo método count com filtros
  async count(filters: Prisma.CompanyWhereInput): Promise<number> {
    return prisma.company.count({
      where: filters,
    });
  },

  async findById(id: string): Promise<(Company & { address: Address | null }) | null> {
    return prisma.company.findUnique({
      where: { id },
      include: { 
        address: true, 
        services: true, // Incluir serviços ao buscar por ID
        professionals: true // Incluir profissionais ao buscar por ID
      }, 
    });
  },

  async create(data: Prisma.CompanyCreateWithoutAddressInput, addressData?: Prisma.AddressCreateWithoutCompanyInput): Promise<Company> {
    return prisma.company.create({
      data: {
        ...data,
        ...(addressData && { 
          address: {
            create: addressData,
          }
        }),
      },
      include: { address: true } 
    });
  },

  async update(id: string, data: Prisma.CompanyUpdateWithoutAddressInput, addressData?: Prisma.AddressUpdateWithoutCompanyInput | Prisma.AddressCreateWithoutCompanyInput | null): Promise<Company> {
    // Prisma update throws P2025 if record not found
    return prisma.company.update({
      where: { id },
      data: {
        ...data,
        address: addressData === null 
          ? { delete: true } 
          : addressData !== undefined
            ? { 
                upsert: { 
                  create: addressData as Prisma.AddressCreateWithoutCompanyInput, 
                  update: addressData as Prisma.AddressUpdateWithoutCompanyInput, 
                }
              }
            : undefined, 
      },
      include: { address: true } 
    });
  },

  async delete(id: string): Promise<Company> {
    // Prisma delete throws P2025 if record not found
    // onDelete: Cascade in Address schema handles address deletion
    // Need to handle relations like Services, Professionals, Reviews manually or via schema
    // Example: Disconnect or delete related records before deleting company
    // await prisma.service.updateMany({ where: { companyId: id }, data: { companyId: null } }); // Or delete
    // await prisma.professional.updateMany({ where: { companyId: id }, data: { companyId: null } }); // Or delete
    
    return prisma.company.delete({
      where: { id },
    });
  },
};

