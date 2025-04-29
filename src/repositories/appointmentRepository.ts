import { prisma } from "../lib/prisma";
import { Prisma, Appointment, AppointmentStatus } from "@prisma/client";

export const appointmentRepository = {
  async findById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
      where: { id },
      include: { 
        user: true, 
        service: true, 
        professional: true 
      }, // Incluir relações
    });
  },

  async findByUser(userId: string, status?: AppointmentStatus): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: {
        userId,
        status: status ? status : undefined,
      },
      include: { 
        service: { include: { company: true } }, // Incluir serviço e empresa
        professional: true 
      },
      orderBy: {
        date: 'asc', // Ordenar por data
      },
    });
  },

  async findByProfessional(professionalId: string, date?: Date): Promise<Appointment[]> {
    // Pode ser útil para verificar disponibilidade
    return prisma.appointment.findMany({
      where: {
        professionalId,
        date: date ? { gte: date } : undefined, // Buscar a partir de uma data específica
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] } // Excluir cancelados/completos
      },
      orderBy: {
        date: 'asc',
      },
    });
  },

  async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    return prisma.appointment.create({
      data,
    });
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
    return prisma.appointment.update({
      where: { id },
      data: { status },
    });
  },

  async delete(id: string): Promise<Appointment | null> {
    return prisma.appointment.delete({
      where: { id },
    });
  },

  // Adicionar outras funções conforme necessário
};
