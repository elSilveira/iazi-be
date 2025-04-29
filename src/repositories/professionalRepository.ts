import { prisma } from "../lib/prisma";
import { Prisma, Professional } from "@prisma/client";

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

  async create(data: Prisma.ProfessionalCreateInput, serviceIds?: string[]): Promise<Professional> {
    // Usar transação para criar o profissional e conectar aos serviços
    return prisma.$transaction(async (tx) => {
      const newProfessional = await tx.professional.create({
        data,
      });

      if (serviceIds && serviceIds.length > 0) {
        const serviceConnections = serviceIds.map((serviceId) => ({
          professionalId: newProfessional.id,
          serviceId: serviceId,
        }));
        await tx.professionalService.createMany({
          data: serviceConnections,
          skipDuplicates: true, // Evitar erro se a combinação já existir (embora não deva acontecer na criação)
        });
      }

      // Retornar o profissional com os serviços incluídos
      return tx.professional.findUniqueOrThrow({
        where: { id: newProfessional.id },
        include: { services: { include: { service: true } } },
      });
    });
  },

  async update(id: string, data: Prisma.ProfessionalUpdateInput, serviceIds?: string[]): Promise<Professional | null> {
    // Usar transação para atualizar o profissional e suas conexões de serviço
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Atualizar os dados do profissional
        const updatedProfessional = await tx.professional.update({
          where: { id },
          data,
        });

        // 2. Gerenciar conexões de serviço (se serviceIds for fornecido)
        if (serviceIds !== undefined) {
          // 2a. Remover conexões existentes
          await tx.professionalService.deleteMany({
            where: { professionalId: id },
          });

          // 2b. Criar novas conexões (se houver serviceIds)
          if (serviceIds.length > 0) {
            const serviceConnections = serviceIds.map((serviceId) => ({
              professionalId: id,
              serviceId: serviceId,
            }));
            await tx.professionalService.createMany({
              data: serviceConnections,
              skipDuplicates: true,
            });
          }
        }

        // 3. Retornar o profissional atualizado com os serviços incluídos
        return tx.professional.findUniqueOrThrow({
          where: { id: updatedProfessional.id },
          include: { services: { include: { service: true } } },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // P2025: Registro para atualizar não encontrado
        return null;
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Professional | null> {
    // Usar transação para garantir que todas as operações ocorram
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Desconectar de ProfessionalService
        await tx.professionalService.deleteMany({ where: { professionalId: id } });
        
        // 2. Desassociar Agendamentos (definir professionalId como null)
        // A regra onDelete: SetNull no schema deve cuidar disso automaticamente.
        // Mas podemos fazer explicitamente se quisermos mais controle ou se a regra não existir.
        // await tx.appointment.updateMany({ 
        //   where: { professionalId: id }, 
        //   data: { professionalId: null } 
        // });

        // 3. Desassociar Avaliações (definir professionalId como null)
        // O schema já tem professionalId? e onDelete: SetNull implícito por ser opcional?
        // Vamos fazer explicitamente para garantir.
        await tx.review.updateMany({ 
          where: { professionalId: id }, 
          data: { professionalId: null } 
        });

        // 4. Deletar o profissional
        const deletedProfessional = await tx.professional.delete({
          where: { id },
        });
        return deletedProfessional;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // P2025: Registro para deletar não encontrado
        return null;
      }
      // Tratar outros erros potenciais (ex: P2003 se alguma FK ainda impedir)
      throw error;
    }
  },
};
