import { prisma } from "../lib/prisma";
import { Prisma, Company } from "@prisma/client";

export const companyRepository = {
  async findById(id: string): Promise<Company | null> {
    return prisma.company.findUnique({
      where: { id },
      include: { 
        address: true, 
        services: true, 
        professionals: true, 
        reviews: true 
      }, // Incluir relações
    });
  },

  async getAll(): Promise<Company[]> {
    return prisma.company.findMany({
      include: { address: true }, // Incluir endereço na listagem geral
    });
  },

  async create(data: Prisma.CompanyCreateInput): Promise<Company> {
    // Prisma não suporta criação aninhada direta de um-para-um (Address) ou um-para-muitos (Services, Professionals) desta forma simples.
    // A criação de relações precisa ser tratada separadamente ou com transações.
    // Por enquanto, vamos focar na criação da empresa básica.
    const { address, services, professionals, reviews, ...companyData } = data;
    return prisma.company.create({
      data: companyData,
    });
    // TODO: Implementar lógica para criar/conectar relações (Address, Services, Professionals)
  },

  async update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company | null> {
    // Similar à criação, a atualização de relações precisa de tratamento especial.
    const { address, services, professionals, reviews, ...companyData } = data;
    return prisma.company.update({
      where: { id },
      data: companyData,
    });
    // TODO: Implementar lógica para atualizar/conectar relações
  },

  async delete(id: string): Promise<Company | null> {
    // A exclusão em cascata está configurada no schema, então o endereço, serviços, etc., relacionados devem ser excluídos.
    return prisma.company.delete({
      where: { id },
    });
  },

  // Adicionar outras funções conforme necessário
};
