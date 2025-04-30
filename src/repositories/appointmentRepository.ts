import { prisma } from "../lib/prisma";
import { Prisma, Appointment, AppointmentStatus } from "@prisma/client";

export const appointmentRepository = {
  // Encontrar múltiplos agendamentos com base em filtros
  async findMany(filters: Prisma.AppointmentWhereInput): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: filters,
      include: { 
        service: true, 
        professional: true, 
        user: { select: { id: true, name: true, email: true, avatar: true } } // Incluir dados relevantes do usuário
      },
      orderBy: {
        date: 'asc', // Ordenar por data
      },
    });
  },

  // Encontrar agendamentos por usuário (opcionalmente por status)
  async findByUser(userId: string, status?: AppointmentStatus): Promise<Appointment[]> {
    return this.findMany({ // Reutilizar findMany
      userId,
      ...(status && { status }),
    });
  },

  // Encontrar agendamentos por profissional (poderia adicionar filtro de data)
  async findByProfessional(professionalId: string): Promise<Appointment[]> {
     return this.findMany({ // Reutilizar findMany
      professionalId,
    });
  },

  async findById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
      where: { id },
      include: { 
        service: true, 
        professional: true, 
        user: { select: { id: true, name: true, email: true, avatar: true } }
      },
    });
  },

  async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    return prisma.appointment.create({
      data,
    });
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
    try {
      return await prisma.appointment.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Agendamento não encontrado
      }
      throw error;
    }
  },

  async delete(id: string): Promise<Appointment | null> {
    try {
      return await prisma.appointment.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Agendamento não encontrado
      }
      throw error;
    }
  },
};

