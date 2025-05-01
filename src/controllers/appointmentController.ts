import { Request, Response, NextFunction } from "express";
import { appointmentRepository } from '../repositories/appointmentRepository';
import { serviceRepository } from '../repositories/serviceRepository'; 
import { professionalRepository } from '../repositories/professionalRepository'; 
import { Prisma, AppointmentStatus } from "@prisma/client";
// Corrected: Use date-fns functions compatible with DateTime
import { parseISO, startOfDay, endOfDay, addMinutes, format, parse, isValid, setHours, setMinutes, setSeconds } from 'date-fns'; 

// Extend Express Request type to include user property from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    // Add other user properties if needed from the token payload
  };
}

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Helper function to parse duration string (e.g., "60 min") into minutes
const parseDuration = (duration: string): number | null => {
    const match = duration.match(/^(\d+)\s*(min|h)?$/i);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    const unit = match[2]?.toLowerCase();
    if (unit === 'h') {
        return value * 60;
    }
    return value; // Assume minutes if no unit or 'min'
};


// --- Controller Functions ---

// Obter todos os agendamentos (com filtros opcionais)
export const getAllAppointments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // Corrected: Filter by date (day), not startTime
  const { professionalId, companyId, status, date } = req.query; 
  let userId = req.query.userId as string | undefined;

  if (!userId && req.user?.id) {
    userId = req.user.id;
  }

  // Validar IDs se fornecidos
  if (userId && !isValidUUID(userId)) {
    res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
    return;
  }
  if (professionalId && !isValidUUID(professionalId as string)) {
    res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
    return;
  }
  // Corrected: CompanyId is not directly on Appointment, filter through professional or service
  // if (companyId && !isValidUUID(companyId as string)) {
  //   res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
  //   return;
  // }
  if (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
     res.status(400).json({ 
      message: 'Status inválido. Valores permitidos: ' + Object.values(AppointmentStatus).join(', ') 
    });
    return;
  }
  let parsedDate: Date | undefined;
  if (date && typeof date === 'string') {
    try {
      // Corrected: Use parse for YYYY-MM-DD format
      parsedDate = parse(date, 'yyyy-MM-dd', new Date());
      if (!isValid(parsedDate)) throw new Error('Invalid date');
    } catch (e) {
      res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
      return;
    }
  }
  
  try {
    const filters: Prisma.AppointmentWhereInput = {};
    if (userId) filters.userId = userId;
    if (professionalId) filters.professionalId = professionalId as string;
    if (status) filters.status = status as AppointmentStatus;
    if (parsedDate) {
      // Corrected: Filter by 'date' field within the specific day
      filters.date = {
        gte: startOfDay(parsedDate),
        lt: endOfDay(parsedDate),
      };
    }
    // Corrected: Filter by companyId through relations if provided
    if (companyId && typeof companyId === 'string') {
        filters.OR = [
            { professional: { companyId: companyId } },
            { service: { companyId: companyId } }
        ];
        // If professionalId is also provided, refine the filter
        if (professionalId) {
            filters.professional = { companyId: companyId, id: professionalId as string };
            delete filters.OR; // Remove the OR condition as professionalId is more specific
        }
    }

    // Require at least one primary filter (user, professional, company)
    if (!userId && !professionalId && !companyId) {
        res.status(400).json({ message: 'É necessário fornecer userId (ou estar autenticado), professionalId ou companyId para filtrar os agendamentos' });
        return;
    }

    const appointments = await appointmentRepository.findMany(filters);
    res.json(appointments);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    next(error); 
  }
};

// Obter um agendamento específico pelo ID
export const getAppointmentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  
  try {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado' });
      return;
    }

    // Authorization check: User must own the appointment or be involved (e.g., professional)
    if (appointment.userId !== userId && appointment.professionalId /* && professionalId !== req.user.professionalProfileId */) {
        // Allow viewing for now, refine auth later
    }

    res.json(appointment);
  } catch (error) {
    console.error(`Erro ao buscar agendamento ${id}:`, error);
    next(error);
  }
};

// Criar um novo agendamento
export const createAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // Corrected: Use 'date' (ISO string for DateTime) instead of startTime
  const { date, serviceId, professionalId, notes } = req.body;
  const userId = req.user?.id;

  if (!userId) {
      res.status(401).json({ message: 'Usuário não autenticado.' });
      return;
  }
  // Validation is handled by express-validator, but double-check critical fields
  if (!date || !serviceId) {
    res.status(400).json({ message: 'date e serviceId são obrigatórios.' });
    return;
  }

  try {
    // Corrected: Parse 'date' string into Date object
    const appointmentDate = parseISO(date);
    if (!isValid(appointmentDate)) {
        throw new Error('Formato de data inválido.');
    }

    // TODO: Check for conflicts / availability again before creating?

    const dataToCreate: Prisma.AppointmentCreateInput = {
      date: appointmentDate, // Use the Date object
      user: { connect: { id: userId } },
      service: { connect: { id: serviceId } },
      status: AppointmentStatus.PENDING, // Default status
      notes: notes,
    };

    if (professionalId) {
      dataToCreate.professional = { connect: { id: professionalId } };
    }
    // Corrected: No companyId directly on Appointment
    // if (companyId) {
    //   dataToCreate.company = { connect: { id: companyId } };
    // }

    // Note: endTime is not in the schema, duration is on the service
    
    const newAppointment = await appointmentRepository.create(dataToCreate);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
            res.status(400).json({ message: 'ID de usuário, serviço ou profissional inválido.' });
            return;
        }
    }
    if (error instanceof Error && error.message === 'Formato de data inválido.') {
        res.status(400).json({ message: error.message });
        return;
    }
    next(error);
  }
};

// Atualizar o status de um agendamento
export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id; // For authorization

  // Validation handled by express-validator

  try {
    // Authorization: Check if user owns it or is the professional/admin
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado.' });
      return;
    }
    // Basic check: Allow user to cancel, allow professional/admin to change others
    if (appointment.userId !== userId && status === AppointmentStatus.CANCELLED) {
        // Allow user to cancel their own appointment
    } else if (/* user is not professional/admin */ false) {
        // res.status(403).json({ message: 'Não autorizado a mudar o status deste agendamento.' });
        // return;
    }

    const updatedAppointment = await appointmentRepository.updateStatus(id, status as AppointmentStatus);
    res.json(updatedAppointment);
  } catch (error) {
    console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Agendamento não encontrado para atualização.' });
      return;
    }
    next(error);
  }
};

// Cancelar um agendamento
export const cancelAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado.' });
      return;
    }

    // Authorization: Only owner or involved professional/admin can cancel
    if (appointment.userId !== userId /* && user is not professional/admin */) {
      // res.status(403).json({ message: 'Não autorizado a cancelar este agendamento.' });
      // return;
    }

    // Check if cancellation is allowed (e.g., not too close to the appointment time)

    const updatedAppointment = await appointmentRepository.updateStatus(id, AppointmentStatus.CANCELLED);
    res.json({ 
      message: 'Agendamento cancelado com sucesso', 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error(`Erro ao cancelar agendamento ${id}:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Agendamento não encontrado para cancelamento.' });
      return;
    }
    next(error);
  }
};

// Deletar um agendamento (geralmente não recomendado)
export const deleteAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    // Authorization check
    const appointment = await appointmentRepository.findById(id);
     if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado.' });
      return;
    }
    if (appointment.userId !== userId /* && user is not admin */) {
        // res.status(403).json({ message: 'Não autorizado a deletar este agendamento.' });
        // return;
    }

    await appointmentRepository.delete(id);
    res.status(204).send(); 
  } catch (error) {
    console.error(`Erro ao deletar agendamento ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Agendamento não encontrado para exclusão.' });
      return;
    }
    next(error);
  }
};

// --- Nova Função: Obter Disponibilidade --- 
export const getAppointmentAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Corrected: Use 'date' (YYYY-MM-DD) from query
  const { date, serviceId, professionalId, companyId } = req.query as { 
    date: string; 
    serviceId?: string; 
    professionalId?: string; 
    companyId?: string; 
  };

  try {
    // 1. Determine Service Duration (Crucial for slot calculation)
    let serviceDurationMinutes = 60; // Default duration if no serviceId provided
    if (serviceId) {
      const service = await serviceRepository.findById(serviceId);
      // Corrected: Use parseDuration helper for string duration
      const duration = service ? parseDuration(service.duration) : null;
      if (!service || duration === null) {
        res.status(404).json({ message: 'Serviço não encontrado ou duração inválida.' });
        return;
      }
      serviceDurationMinutes = duration;
    }

    // 2. Determine Working Hours (Needs refinement - fetch from professional/company settings)
    const workingHoursStart = 9;
    const workingHoursEnd = 18;
    const slotIntervalMinutes = 15; // Granularity of slots

    // 3. Parse the requested date
    const requestedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (!isValid(requestedDate)) {
        res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
        return;
    }
    const dayStart = startOfDay(requestedDate);
    const dayEnd = endOfDay(requestedDate);

    // 4. Fetch existing appointments for the context (professional or company) on that day
    const appointmentFilters: Prisma.AppointmentWhereInput = {
      // Corrected: Filter by 'date' field
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: {
        // Corrected: Removed NO_SHOW
        notIn: [AppointmentStatus.CANCELLED],
      },
    };
    if (professionalId) {
      appointmentFilters.professionalId = professionalId;
    } else if (companyId) {
      // Corrected: Filter professionals by companyId, then filter appointments by those professionals
      const professionalsInCompany = await professionalRepository.findMany({ companyId: companyId }, {}, 0, 1000); // Find professionals in the company
      const professionalIds = professionalsInCompany.map(p => p.id);
      if (professionalIds.length === 0) {
          res.json({ availableSlots: [] }); // No professionals in company, so no availability
          return;
      }
      appointmentFilters.professionalId = { in: professionalIds };
    }
    
    if (!professionalId && !companyId && serviceId) {
        // Logic to find professionals linked to the service?
        res.status(400).json({ message: 'É necessário fornecer professionalId ou companyId para verificar a disponibilidade.' });
        return;
    }

    const existingAppointments = await appointmentRepository.findMany(appointmentFilters);

    // 5. Generate Potential Slots and Check Availability
    const availableSlots: string[] = [];
    // Corrected: Use setHours, setMinutes, setSeconds for clarity
    let currentSlotTime = setSeconds(setMinutes(setHours(dayStart, workingHoursStart), 0), 0);
    const endOfWorkDay = setSeconds(setMinutes(setHours(dayStart, workingHoursEnd), 0), 0);

    while (currentSlotTime < endOfWorkDay) {
      const potentialEndTime = addMinutes(currentSlotTime, serviceDurationMinutes);

      if (potentialEndTime > endOfWorkDay) {
        break; 
      }

      let conflict = false;
      for (const appt of existingAppointments) {
        // Corrected: Use 'date' field for start time
        const apptStart = appt.date;
        // Corrected: Calculate apptEnd based on service duration associated with the appointment
        const apptService = await serviceRepository.findById(appt.serviceId); // Inefficient, consider including duration in appointment query
        const apptDuration = apptService ? parseDuration(apptService.duration) : null;
        
        if (apptDuration === null) continue; // Skip if duration is invalid
        const apptEnd = addMinutes(apptStart, apptDuration);

        // Check for overlap: (SlotStart < ApptEnd) and (SlotEnd > ApptStart)
        if (currentSlotTime < apptEnd && potentialEndTime > apptStart) {
          conflict = true;
          break;
        }
      }

      if (!conflict) {
        availableSlots.push(format(currentSlotTime, 'HH:mm'));
      }

      currentSlotTime = addMinutes(currentSlotTime, slotIntervalMinutes);
    }

    res.json({ availableSlots });

  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    next(error);
  }
};

