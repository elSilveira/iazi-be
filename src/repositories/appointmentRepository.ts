import { prisma } from "../lib/prisma";
import { Prisma, Appointment, AppointmentStatus } from "@prisma/client";

// Define the type for Appointment with included relations
export type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: {
    services: { include: { service: true } },
    professional: {
      include: {
        company: { include: { address: true } },
        services: { include: { service: true } },
      },
    },
    company: true,
    user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
  },
}>;

export const appointmentRepository = {
  // Define the include object for consistency
  includeDetails: {
    services: { include: { service: true } },
    professional: {
      include: {
        company: { include: { address: true } },
        services: { include: { service: true } },
      },
    },
    company: true,
    user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
  } as const, // Use 'as const' for stricter type checking
  // Encontrar múltiplos agendamentos com base em filtros
  async findMany(filters: Prisma.AppointmentWhereInput): Promise<AppointmentWithDetails[]> {
    return prisma.appointment.findMany({
      where: filters,
      include: this.includeDetails,
      orderBy: {
        startTime: "asc", // Ordenar por horário de início
      },
    });
  },

  // Encontrar agendamentos por usuário (opcionalmente por status)
  async findByUser(userId: string, status?: AppointmentStatus): Promise<AppointmentWithDetails[]> {
    return this.findMany({ // Reutilizar findMany
      userId,
      ...(status && { status }),
    });
  },

  // Encontrar agendamentos por profissional (poderia adicionar filtro de data)
  async findByProfessional(professionalId: string): Promise<AppointmentWithDetails[]> {
    return this.findMany({ // Reutilizar findMany
      professionalId,
    });
  },

  async findById(id: string): Promise<AppointmentWithDetails | null> {
    return prisma.appointment.findUnique({
      where: { id },
      include: this.includeDetails,
    });
  },

  async create(data: Prisma.AppointmentCreateInput): Promise<AppointmentWithDetails> {
    const newAppointment = await prisma.appointment.create({
      data,
    });
    // Re-fetch with includes to ensure the correct return type
    return prisma.appointment.findUniqueOrThrow({
        where: { id: newAppointment.id },
        include: this.includeDetails,
    });
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<AppointmentWithDetails | null> {
    try {
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status },
      });
      // Re-fetch with includes
      return prisma.appointment.findUnique({
          where: { id: updatedAppointment.id },
          include: this.includeDetails,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return null; // Agendamento não encontrado
      }
      throw error;
    }
  },

  async delete(id: string): Promise<AppointmentWithDetails | null> {
    try {
      // Fetch before deleting to return the full object (optional, depends on need)
      const appointmentToDelete = await prisma.appointment.findUnique({
          where: { id },
          include: this.includeDetails,
      });
      if (!appointmentToDelete) return null; // Already gone
      
      await prisma.appointment.delete({
        where: { id },
      });
      return appointmentToDelete; // Return the fetched object
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return null; // Agendamento não encontrado
      }
      throw error;
    }
  },
};

