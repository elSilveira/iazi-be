import { prisma } from "../lib/prisma";
import { Prisma, Appointment, AppointmentStatus } from "@prisma/client";

// Enhanced logging for debugging
const DEBUG_MODE = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';

function logDebug(message: string, data?: any) {
  // Always log in development, or if DEBUG=true in production
  if (DEBUG_MODE) {
    console.log(`[AppointmentRepository] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

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
    logDebug(`Finding appointments with filters`, filters);
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
    logDebug(`Finding appointments for user ${userId}${status ? ` with status ${status}` : ''}`);
    return this.findMany({ // Reutilizar findMany
      userId,
      ...(status && { status }),
    });
  },

  // Encontrar agendamentos por profissional (poderia adicionar filtro de data)
  async findByProfessional(professionalId: string): Promise<AppointmentWithDetails[]> {
    logDebug(`Finding appointments for professional ${professionalId}`);
    return this.findMany({ // Reutilizar findMany
      professionalId,
    });
  },

  async findById(id: string): Promise<AppointmentWithDetails | null> {
    logDebug(`Finding appointment by id ${id}`);
    return prisma.appointment.findUnique({
      where: { id },
      include: this.includeDetails,
    });
  },

  async create(data: Prisma.AppointmentCreateInput): Promise<AppointmentWithDetails> {
    logDebug(`Creating new appointment`, {
      professionalId: data.professional?.connect?.id,
      userId: data.user?.connect?.id,
      startTime: data.startTime,
      serviceCount: data.services?.create ? 
        (Array.isArray(data.services.create) ? data.services.create.length : 1) : 0
    });
    
    const newAppointment = await prisma.appointment.create({
      data,
    });
    
    logDebug(`Created appointment with ID: ${newAppointment.id}`);
    
    // Re-fetch with includes to ensure the correct return type
    return prisma.appointment.findUniqueOrThrow({
        where: { id: newAppointment.id },
        include: this.includeDetails,
    });
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<AppointmentWithDetails | null> {
    try {
      logDebug(`Updating appointment ${id} to status ${status}`);
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
        logDebug(`Appointment ${id} not found during status update`);
        return null; // Agendamento não encontrado
      }
      logDebug(`Error updating appointment status: ${(error as Error).message}`);
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
      
      if (!appointmentToDelete) {
        logDebug(`Appointment ${id} not found for deletion`);
        return null;
      }
      
      logDebug(`Deleting appointment ${id}`);
      await prisma.appointment.delete({
          where: { id },
      });
      
      return appointmentToDelete;
    } catch (error) {
      logDebug(`Error deleting appointment: ${(error as Error).message}`);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return null; // Agendamento não encontrado
      }
      throw error;
    }
  }
};

