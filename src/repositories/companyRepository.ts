import { prisma } from "../lib/prisma";
import { Prisma, Company, Address } from "@prisma/client";

export const companyRepository = {
  async getAll(): Promise<Company[]> {
    return prisma.company.findMany({
      include: { address: true }, // Incluir endereço
    });
  },

  async findById(id: string): Promise<(Company & { address: Address | null }) | null> {
    return prisma.company.findUnique({
      where: { id },
      include: { address: true }, // Incluir endereço
    });
  },

  async create(data: Prisma.CompanyCreateWithoutAddressInput, addressData?: Prisma.AddressCreateWithoutCompanyInput): Promise<Company> {
    return prisma.company.create({
      data: {
        ...data,
        // Se addressData for fornecido, cria o endereço associado
        ...(addressData && { 
          address: {
            create: addressData,
          }
        }),
      },
      include: { address: true } // Incluir endereço no retorno
    });
  },

  async update(id: string, data: Prisma.CompanyUpdateWithoutAddressInput, addressData?: Prisma.AddressUpdateWithoutCompanyInput | Prisma.AddressCreateWithoutCompanyInput | null): Promise<Company | null> {
    // addressData = null indica que o endereço deve ser removido (se existir)
    // addressData = objeto indica que deve ser criado ou atualizado
    try {
      return await prisma.company.update({
        where: { id },
        data: {
          ...data,
          address: addressData === null 
            ? { delete: true } // Deleta o endereço existente se addressData for null
            : addressData !== undefined
              ? { 
                  upsert: { // Cria se não existir, atualiza se existir
                    create: addressData as Prisma.AddressCreateWithoutCompanyInput, // Type assertion needed
                    update: addressData as Prisma.AddressUpdateWithoutCompanyInput, // Type assertion needed
                  }
                }
              : undefined, // Não faz nada com o endereço se addressData for undefined
        },
        include: { address: true } // Incluir endereço no retorno
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // P2025: An operation failed because it depends on one or more records that were required but not found. (e.g. Record to update not found.)
        return null;
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Company | null> {
    // onDelete: Cascade no schema do Address deve cuidar da exclusão do endereço associado.
    try {
      return await prisma.company.delete({
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
