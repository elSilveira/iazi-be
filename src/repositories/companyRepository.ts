import { prisma } from "../lib/prisma";
import { Prisma, Company, Address } from "@prisma/client"; // Revertido: Importar de @prisma/client

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

  async create(data: Prisma.CompanyCreateInput): Promise<Company> {
    // A criação do endereço deve ser tratada aqui ou no serviço
    // Exemplo: Se data.address for fornecido, usar connectOrCreate ou create
    return prisma.company.create({
      data,
      // include: { address: true } // Opcional incluir endereço no retorno
    });
  },

  async update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company | null> {
    // A atualização do endereço também precisa ser tratada
    try {
      return await prisma.company.update({
        where: { id },
        data,
        // include: { address: true } // Opcional incluir endereço no retorno
      });
    } catch (error) {
      // Tratar erro P2025 (Registro não encontrado) se necessário, embora findById já possa fazer isso
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Company | null> {
    // Considerar o que fazer com o endereço associado (onDelete: Cascade no schema?)
    try {
      // Se não houver cascade, deletar o endereço primeiro ou desconectar
      // await prisma.address.delete({ where: { companyId: id } }); // Exemplo
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
