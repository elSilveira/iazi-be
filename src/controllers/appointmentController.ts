import { Request, Response, NextFunction } from "express";
import { appointmentRepository } from '../repositories/appointmentRepository';
import { serviceRepository } from '../repositories/serviceRepository'; 
import { professionalRepository } from '../repositories/professionalRepository'; 
import { scheduleBlockRepository } from '../repositories/scheduleBlockRepository'; // Import repository for blocks
import { prisma } from '../utils/prismaClient'; // Import prisma client for direct access if needed
import { Prisma, AppointmentStatus, UserRole } from "@prisma/client"; // Added UserRole
import { parseISO, startOfDay, endOfDay, addMinutes, format, parse, isValid, setHours, setMinutes, setSeconds, getDay, isWithinInterval, differenceInHours, isBefore } from 'date-fns'; // Added differenceInHours and isBefore
import { gamificationService, GamificationEventType } from "../services/gamificationService"; // Import gamification service

// Extend Express Request type to include user with role
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole; // Assuming role is available in the token payload
                // Add other user properties if needed
            };
        }
    }
}

// Constants for Business Rules
const MIN_BOOKING_ADVANCE_HOURS = 1; // Minimum hours in advance to book
const MIN_CANCELLATION_HOURS = 2; // Minimum hours notice required to cancel

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Helper function to parse duration string (e.g., "60min", "1h", "1h30min") into minutes
const parseDuration = (duration: string): number | null => {
    // Handle "1h30min" format
    const hourMinuteMatch = duration.match(/^(?:(\d+)h)?(?:(\d+)min)?$/i);
    if (hourMinuteMatch) {
        const hours = hourMinuteMatch[1] ? parseInt(hourMinuteMatch[1], 10) : 0;
        const minutes = hourMinuteMatch[2] ? parseInt(hourMinuteMatch[2], 10) : 0;
        if (hours > 0 || minutes > 0) {
            return hours * 60 + minutes;
        }
    }
    // Handle "60" or "60min" format
    const simpleMatch = duration.match(/^(\d+)\s*(min)?$/i);
    if (simpleMatch) {
        return parseInt(simpleMatch[1], 10);
    }
    // Handle "1h" format
    const hourMatch = duration.match(/^(\d+)h$/i);
    if (hourMatch) {
        return parseInt(hourMatch[1], 10) * 60;
    }
    return null; // Invalid format
};

// Helper to parse working hours JSON
interface WorkingHours {
    [dayOfWeek: number]: { start: string; end: string } | null; // 0 = Sunday, 6 = Saturday
}

const getWorkingHoursForDay = (workingHoursJson: any, date: Date): { start: Date; end: Date } | null => {
    if (!workingHoursJson || typeof workingHoursJson !== 'object') return null;
    const dayOfWeek = getDay(date); // 0 for Sunday, 1 for Monday, etc.
    const hours = (workingHoursJson as WorkingHours)[dayOfWeek];
    if (!hours || !hours.start || !hours.end) return null;

    try {
        const [startH, startM] = hours.start.split(':').map(Number);
        const [endH, endM] = hours.end.split(':').map(Number);
        const dayStart = startOfDay(date);
        const workStart = setSeconds(setMinutes(setHours(dayStart, startH), startM), 0);
        const workEnd = setSeconds(setMinutes(setHours(dayStart, endH), endM), 0);
        // Handle cases where end time is on the next day (e.g., 22:00 - 02:00)
        if (workEnd <= workStart) {
            // Assuming end time is on the next day if it's earlier or same as start time
            // This logic might need adjustment based on exact business rules for overnight hours
            console.warn("Working hours might span across midnight, adjust logic if needed.");
            // For simplicity, let's assume end time is within the same day for now.
        }
        return { start: workStart, end: workEnd };
    } catch (e) {
        console.error("Error parsing working hours:", e);
        return null;
    }
};


// --- Controller Functions ---

// Obter todos os agendamentos (com filtros opcionais)
export const getAllAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { professionalId, companyId, status, date } = req.query; 
  let userId = req.query.userId as string | undefined;
  const userRole = req.user?.role;
  const authenticatedUserId = req.user?.id;

  // If not admin and no specific userId is requested, default to the authenticated user's appointments
  if (!userId && authenticatedUserId && userRole !== UserRole.ADMIN) {
    userId = authenticatedUserId;
  }

  if (userId && !isValidUUID(userId)) {
    res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
    return;
  }
  if (professionalId && !isValidUUID(professionalId as string)) {
    res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
    return;
  }
  if (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
     res.status(400).json({ 
      message: 'Status inválido. Valores permitidos: ' + Object.values(AppointmentStatus).join(', ') 
    });
    return;
  }
  let parsedDate: Date | undefined;
  if (date && typeof date === 'string') {
    try {
      parsedDate = parse(date, 'yyyy-MM-dd', new Date());
      if (!isValid(parsedDate)) throw new Error('Invalid date');
    } catch (e) {
      res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
      return;
    }
  }
  
  try {
    const filters: Prisma.AppointmentWhereInput = {};
    
    // Authorization: Non-admins can only see their own appointments unless filtering by professional/company?
    // This needs refinement based on exact requirements. For now, allow filtering if IDs are provided.
    if (userId) {
        if (userRole !== UserRole.ADMIN && userId !== authenticatedUserId) {
            res.status(403).json({ message: 'Não autorizado a ver agendamentos de outro usuário.' });
            return;
        }
        filters.userId = userId;
    } else if (userRole !== UserRole.ADMIN && !professionalId && !companyId) {
        // If no filters and not admin, default to own appointments
        if (authenticatedUserId) {
            filters.userId = authenticatedUserId;
        } else {
             res.status(401).json({ message: 'Não autenticado.' });
             return;
        }
    }

    if (professionalId) filters.professionalId = professionalId as string;
    if (status) filters.status = status as AppointmentStatus;
    if (parsedDate) {
      filters.date = {
        gte: startOfDay(parsedDate),
        lt: endOfDay(parsedDate),
      };
    }
    if (companyId && typeof companyId === 'string') {
        // Refined filter: If companyId is given, filter by professionals within that company
        const professionalsInCompany = await professionalRepository.findMany({ companyId: companyId }, {}, 0, 1000);
        const professionalIds = professionalsInCompany.map(p => p.id);
        if (professionalIds.length > 0) {
            if (filters.professionalId) {
                // If both professionalId and companyId are given, ensure professional belongs to company
                if (!professionalIds.includes(filters.professionalId as string)) {
                    res.json([]); // Professional not in the specified company
                    return;
                }
            } else {
                filters.professionalId = { in: professionalIds };
            }
        } else {
             res.json([]); // No professionals in the company
             return;
        }
    }

    // Ensure at least one context (user, professional, company) is implicitly or explicitly defined for non-admins
    if (userRole !== UserRole.ADMIN && !filters.userId && !filters.professionalId && !companyId) {
         res.status(400).json({ message: 'Filtro insuficiente. Forneça userId, professionalId ou companyId.' });
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
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const user = req.user; // Contains id and role

  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  
  try {
    const appointment = await appointmentRepository.findByIdWithProfessional(id); // Fetch professional for auth check
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado' });
      return;
    }

    // Authorization check
    const isOwner = appointment.userId === user?.id;
    const isProfessional = appointment.professionalId === user?.id; // Assuming professional's user ID is used
    const isAdmin = user?.role === UserRole.ADMIN;
    // TODO: Check if user is admin of the company associated with the professional?

    if (!isOwner && !isProfessional && !isAdmin) {
        res.status(403).json({ message: 'Não autorizado a ver este agendamento.' });
        return;
    }

    res.json(appointment);
  } catch (error) {
    console.error(`Erro ao buscar agendamento ${id}:`, error);
    next(error);
  }
};

// Criar um novo agendamento
export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { date, serviceId, professionalId, notes } = req.body;
  const userId = req.user?.id;

  if (!userId) {
      res.status(401).json({ message: 'Usuário não autenticado.' });
      return;
  }
  if (!date || !serviceId) {
    res.status(400).json({ message: 'date e serviceId são obrigatórios.' });
    return;
  }

  try {
    const appointmentDate = parseISO(date);
    if (!isValid(appointmentDate) || isBefore(appointmentDate, new Date())) {
        res.status(400).json({ message: 'Data inválida. Use o formato ISO 8601 e a data não pode ser no passado.' });
        return;
    }

    // --- Validação de Regras de Negócio (Antecedência Mínima) ---
    const now = new Date();
    const hoursDifference = differenceInHours(appointmentDate, now);
    if (hoursDifference < MIN_BOOKING_ADVANCE_HOURS) {
        res.status(400).json({ message: `É necessário agendar com pelo menos ${MIN_BOOKING_ADVANCE_HOURS} hora(s) de antecedência.` });
        return;
    }

    // --- Validação Pré-Criação (Disponibilidade) ---
    const service = await serviceRepository.findById(serviceId);
    const duration = service ? parseDuration(service.duration) : null;
    if (!service || duration === null) {
        res.status(404).json({ message: 'Serviço não encontrado ou duração inválida.' });
        return;
    }
    const appointmentEnd = addMinutes(appointmentDate, duration);

    // Fetch professional (required for availability check)
    let targetProfessionalId = professionalId;
    if (!targetProfessionalId) {
        const profServices = await prisma.professionalService.findMany({ where: { serviceId: serviceId }, include: { professional: true } });
        if (profServices.length === 1) {
            targetProfessionalId = profServices[0].professionalId;
        } else if (profServices.length > 1) {
             res.status(400).json({ message: 'professionalId é obrigatório para este serviço, pois múltiplos profissionais o oferecem.' });
             return;
        } else {
            res.status(404).json({ message: 'Nenhum profissional encontrado que ofereça este serviço.' });
            return;
        }
    } else {
        if (!isValidUUID(targetProfessionalId)) {
            res.status(400).json({ message: 'Formato de professionalId inválido.' });
            return;
        }
        const profServiceLink = await prisma.professionalService.findUnique({
            where: { professionalId_serviceId: { professionalId: targetProfessionalId, serviceId: serviceId } }
        });
        if (!profServiceLink) {
            res.status(400).json({ message: 'O profissional especificado não oferece este serviço.' });
            return;
        }
    }

    const isAvailable = await checkAvailability(targetProfessionalId, appointmentDate, appointmentEnd);
    if (!isAvailable) {
        res.status(409).json({ message: 'Horário indisponível.' }); // 409 Conflict
        return;
    }
    // --- Fim Validação Pré-Criação ---

    const dataToCreate: Prisma.AppointmentCreateInput = {
      date: appointmentDate, 
      user: { connect: { id: userId } },
      service: { connect: { id: serviceId } },
      status: AppointmentStatus.PENDING, 
      notes: notes,
      professional: { connect: { id: targetProfessionalId } } // Connect determined professional
    };
    
    const newAppointment = await appointmentRepository.create(dataToCreate);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
             res.status(400).json({ message: `Referência inválida para ${error.meta?.field_name}. Verifique os IDs fornecidos.` });
             return;
        }
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Registro relacionado não encontrado (usuário, serviço ou profissional).'});
            return;
        }
    }
    if (error instanceof Error && error.message.startsWith('Formato de data inválido')) {
        res.status(400).json({ message: error.message });
        return;
    }
    next(error);
  }
};

// Atualizar o status de um agendamento
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status: AppointmentStatus }; // Type assertion
  const user = req.user;

  if (!user) {
      res.status(401).json({ message: 'Não autenticado.' });
      return;
  }

  // Validate status from body (already done by validator, but good practice)
  if (!Object.values(AppointmentStatus).includes(status)) {
      res.status(400).json({ message: 'Status inválido fornecido.' });
      return;
  }

  try {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado.' });
      return;
    }

    // --- Authorization & Business Logic for Status Change ---
    const isAdmin = user.role === UserRole.ADMIN;
    // Assuming professional's user ID matches appointment.professionalId
    // This might need adjustment if professionals have separate user accounts
    const isProfessional = appointment.professionalId === user.id; 
    const isOwner = appointment.userId === user.id;

    let canUpdate = false;
    const currentStatus = appointment.status;
    const now = new Date();

    switch (status) {
        case AppointmentStatus.CONFIRMED:
            // Only Professional or Admin can confirm a PENDING appointment
            if ((isProfessional || isAdmin) && currentStatus === AppointmentStatus.PENDING) {
                canUpdate = true;
            }
            break;
        case AppointmentStatus.COMPLETED:
            // Only Professional or Admin can complete a CONFIRMED appointment, and only after it has started
            if ((isProfessional || isAdmin) && currentStatus === AppointmentStatus.CONFIRMED && isBefore(appointment.date, now)) {
                 canUpdate = true;
            }
            break;
        case AppointmentStatus.CANCELLED:
            // Use the dedicated cancel endpoint for cancellation logic
            res.status(400).json({ message: 'Use o endpoint PATCH /api/appointments/{id}/cancel para cancelar.' });
            return;
        case AppointmentStatus.PENDING:
            // Generally, shouldn't revert to PENDING unless specific admin action
            if (isAdmin) { 
                // Allow admin to revert? Needs business rule clarification.
                // canUpdate = true; 
            }
            break;
    }

    if (!canUpdate) {
        res.status(403).json({ message: 'Não autorizado a atualizar para este status ou transição inválida.' });
        return;
    }
    // --- End Authorization & Business Logic ---

    const updatedAppointment = await appointmentRepository.updateStatus(id, status);

    // --- GAMIFICATION INTEGRATION START ---
    // Trigger APPOINTMENT_COMPLETED event if status is updated to COMPLETED
    if (status === AppointmentStatus.COMPLETED && currentStatus !== AppointmentStatus.COMPLETED) {
        // Run this asynchronously, don't block the status update response
        gamificationService.triggerEvent(appointment.userId, GamificationEventType.APPOINTMENT_COMPLETED, {
            relatedEntityId: updatedAppointment.id,
            relatedEntityType: "Appointment",
        }).catch(err => console.error("Gamification event trigger failed for APPOINTMENT_COMPLETED:", err));
    }
    // --- GAMIFICATION INTEGRATION END ---

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
export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const user = req.user;

   if (!user) {
      res.status(401).json({ message: 'Não autenticado.' });
      return;
  }

  try {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado.' });
      return;
    }

    // --- Authorization & Business Logic for Cancellation ---
    const isAdmin = user.role === UserRole.ADMIN;
    const isProfessional = appointment.professionalId === user.id; // Assuming professional's user ID
    const isOwner = appointment.userId === user.id;

    // Allow Owner, Professional, or Admin to cancel
    if (!isOwner && !isProfessional && !isAdmin) {
        res.status(403).json({ message: 'Não autorizado a cancelar este agendamento.' });
        return;
    }

    // Check if already cancelled or completed
    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.COMPLETED) {
        res.status(400).json({ message: `Agendamento já está ${appointment.status}.` });
        return;
    }

    // Check minimum cancellation notice (only applies if appointment is in the future)
    const now = new Date();
    if (isBefore(now, appointment.date)) { // Only check notice period for future appointments
        const hoursDifference = differenceInHours(appointment.date, now);
        if (hoursDifference < MIN_CANCELLATION_HOURS) {
            // Exception: Admin might override this rule?
            if (!isAdmin) { 
                 res.status(400).json({ message: `Não é possível cancelar. É necessário ${MIN_CANCELLATION_HOURS} hora(s) de antecedência.` });
                 return;
            }
        }
    }
    // --- End Authorization & Business Logic ---

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

// Deletar um agendamento (geralmente não recomendado, prefer cancel)
export const deleteAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const user = req.user;

  if (!user) {
      res.status(401).json({ message: 'Não autenticado.' });
      return;
  }

  try {
    const appointment = await appointmentRepository.findById(id);
     if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado.' });
      return;
    }
    // Authorization: Only Admin can delete?
    if (user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Não autorizado a deletar este agendamento.' });
        return;
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
  const { date, serviceId, professionalId, companyId } = req.query as { 
    date: string; 
    serviceId?: string; 
    professionalId?: string; 
    companyId?: string; 
  };

  try {
    // 1. Validar e Parsear Data
    const requestedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (!isValid(requestedDate)) {
        res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
        return;
    }
    const dayStart = startOfDay(requestedDate);
    const dayEnd = endOfDay(requestedDate);

    // 2. Determinar Serviço e Duração
    if (!serviceId || !isValidUUID(serviceId)) {
        res.status(400).json({ message: 'serviceId é obrigatório e deve ser um UUID válido.' });
        return;
    }
    const service = await serviceRepository.findById(serviceId);
    const serviceDurationMinutes = service ? parseDuration(service.duration) : null;
    if (!service || serviceDurationMinutes === null) {
      res.status(404).json({ message: 'Serviço não encontrado ou duração inválida.' });
      return;
    }

    // 3. Determinar Profissional(is) e Horário de Trabalho
    let targetProfessionalIds: string[] = [];
    let professionalWorkingHours: WorkingHours | null = null; // Specific professional hours
    let companyWorkingHours: WorkingHours | null = null; // Fallback company hours

    if (professionalId && isValidUUID(professionalId)) {
        const professional = await professionalRepository.findByIdWithCompany(professionalId); // Assume this fetches company relation
        if (!professional) {
            res.status(404).json({ message: 'Profissional não encontrado.' });
            return;
        }
        // Check if professional offers the serviceId
        const profServiceLink = await prisma.professionalService.findUnique({
            where: { professionalId_serviceId: { professionalId: professionalId, serviceId: serviceId } }
        });
        if (!profServiceLink) {
             res.json({ availableSlots: [] }); // Professional doesn't offer this service
             return;
        }

        targetProfessionalIds = [professionalId];
        professionalWorkingHours = professional.workingHours as WorkingHours | null;
        companyWorkingHours = professional.company?.workingHours as WorkingHours | null;

    } else if (companyId && isValidUUID(companyId)) {
        // Find professionals in the company that offer the service
        const professionals = await professionalRepository.findManyByCompanyAndService(companyId, serviceId);
        if (professionals.length === 0) {
            res.json({ availableSlots: [] }); // No professionals offer this service in this company
            return;
        }
        targetProfessionalIds = professionals.map(p => p.id);
        // For company-wide check, use company hours as primary? Or individual? Needs clarification.
        // Using company hours as fallback if professional hours are not set.
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        companyWorkingHours = company?.workingHours as WorkingHours | null;
        // Note: Individual professional hours might differ, making company-wide check complex.
        // This implementation assumes we check against company hours OR individual if available.

    } else {
        res.status(400).json({ message: 'É necessário fornecer professionalId ou companyId.' });
        return;
    }

    // Determine the working hours for the specific day
    const workingHours = getWorkingHoursForDay(professionalWorkingHours ?? companyWorkingHours, requestedDate);
    if (!workingHours) {
        res.json({ availableSlots: [] }); // Not working on this day
        return;
    }
    const workStartTime = workingHours.start;
    const workEndTime = workingHours.end;

    // 4. Fetch Existing Appointments and Blocks for the target professional(s) on that day
    const appointmentFilters: Prisma.AppointmentWhereInput = {
      professionalId: { in: targetProfessionalIds },
      date: { gte: dayStart, lt: dayEnd },
      status: { notIn: [AppointmentStatus.CANCELLED] },
    };
    const blockFilters: Prisma.ScheduleBlockWhereInput = {
      professionalId: { in: targetProfessionalIds },
      OR: [
        { // Blocks contained within the day
          startTime: { gte: dayStart, lt: dayEnd }
        },
        { // Blocks ending within the day
          endTime: { gt: dayStart, lte: dayEnd }
        },
        { // Blocks starting before and ending after the day
          startTime: { lt: dayStart },
          endTime: { gt: dayEnd }
        },
        { // All-day blocks for the requested date
          isAllDay: true,
          startTime: { lte: dayStart }, // Assuming all-day blocks start at or before the day
          endTime: { gte: dayStart } // Assuming all-day blocks end at or after the day start
        }
      ]
    };

    const [existingAppointments, scheduleBlocks] = await Promise.all([
        appointmentRepository.findManyWithServiceDuration(appointmentFilters), // Assume this fetches service duration
        scheduleBlockRepository.findMany(blockFilters)
    ]);

    // Check for all-day blocks first
    if (scheduleBlocks.some(block => block.isAllDay && isWithinInterval(requestedDate, { start: block.startTime, end: block.endTime }))) {
        res.json({ availableSlots: [] }); // Blocked for the whole day
        return;
    }

    // 5. Generate Potential Slots and Check Availability
    const availableSlots: string[] = [];
    const slotIntervalMinutes = 15; // Granularity of slots
    let currentSlotTime = workStartTime;

    while (currentSlotTime < workEndTime) {
      const potentialEndTime = addMinutes(currentSlotTime, serviceDurationMinutes);

      if (potentialEndTime > workEndTime) {
        break; // Slot extends beyond working hours
      }

      let conflict = false;

      // Check against existing appointments
      for (const appt of existingAppointments) {
        const apptStart = appt.date;
        // Assuming findManyWithServiceDuration returns service duration
        const apptDuration = (appt as any).serviceDurationMinutes; // Use pre-fetched duration
        if (apptDuration === null || apptDuration === undefined) continue; 
        const apptEnd = addMinutes(apptStart, apptDuration);

        // Check for overlap: (SlotStart < ApptEnd) and (SlotEnd > ApptStart)
        if (currentSlotTime < apptEnd && potentialEndTime > apptStart) {
          conflict = true;
          break;
        }
      }
      if (conflict) {
        currentSlotTime = addMinutes(currentSlotTime, slotIntervalMinutes);
        continue;
      }

      // Check against schedule blocks (non-all-day)
      for (const block of scheduleBlocks) {
          if (block.isAllDay) continue; // Already handled
          const blockStart = block.startTime;
          const blockEnd = block.endTime;
          // Check for overlap: (SlotStart < BlockEnd) and (SlotEnd > BlockStart)
          if (currentSlotTime < blockEnd && potentialEndTime > blockStart) {
              conflict = true;
              break;
          }
      }
       if (conflict) {
        currentSlotTime = addMinutes(currentSlotTime, slotIntervalMinutes);
        continue;
      }

      // If no conflict, add the slot
      availableSlots.push(format(currentSlotTime, 'HH:mm'));
      currentSlotTime = addMinutes(currentSlotTime, slotIntervalMinutes);
    }

    res.json({ availableSlots });

  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    next(error);
  }
};

// --- Helper Function for Availability Check (used in createAppointment) ---
const checkAvailability = async (professionalId: string, startTime: Date, endTime: Date): Promise<boolean> => {
    const dayStart = startOfDay(startTime);
    const dayEnd = endOfDay(startTime);

    // Fetch professional and company for working hours
    const professional = await professionalRepository.findByIdWithCompany(professionalId);
    if (!professional) return false; // Professional not found

    const professionalWorkingHours = professional.workingHours as WorkingHours | null;
    const companyWorkingHours = professional.company?.workingHours as WorkingHours | null;
    const workingHours = getWorkingHoursForDay(professionalWorkingHours ?? companyWorkingHours, startTime);

    if (!workingHours || startTime < workingHours.start || endTime > workingHours.end) {
        return false; // Outside working hours
    }

    // Fetch conflicting appointments
    const conflictingAppointments = await prisma.appointment.count({
        where: {
            professionalId: professionalId,
            status: { notIn: [AppointmentStatus.CANCELLED] },
            // Check for overlap: (ApptStart < SlotEnd) and (ApptEnd > SlotStart)
            // We need service duration to calculate ApptEnd. This check is complex here.
            // Simpler check: Check if any appointment STARTS within the slot or vice-versa.
            // This is not fully accurate but simpler without fetching all durations.
            // A more robust check requires fetching appointments and their durations.
            // Let's use the logic from getAvailability: check if slot overlaps any existing appt.
            date: {
                lt: endTime, // Existing appointment starts before the new one ends
            },
            // We need to calculate the end time of existing appointments based on their service duration
            // This makes the check complex here. Let's rely on the check in getAvailability for now
            // and assume this check is simplified or handled differently.
            // For a robust check here, you'd fetch appointments in the range and check overlap with duration.
            // Simplified check (less accurate): Check if any appointment starts exactly at the same time.
            // date: startTime 
            // Let's stick to the more robust check: fetch appointments and check overlap
            AND: [
                {
                    date: {
                        lt: endTime // Existing appt starts before new one ends
                    }
                },
                // We need a way to express 'date + duration > startTime'
                // This requires fetching duration or using a more complex query/logic.
                // Alternative: Check if the requested slot (startTime, endTime) overlaps with any existing (appt.date, appt.date + appt.duration)
            ]
        },
    });

     // Fetch conflicting blocks
    const conflictingBlocks = await prisma.scheduleBlock.count({
        where: {
            professionalId: professionalId,
            OR: [
                { // Block overlaps with slot start
                    startTime: { lt: endTime },
                    endTime: { gt: startTime }
                },
                 { // Block is contained within the slot (unlikely but possible)
                    startTime: { gte: startTime },
                    endTime: { lte: endTime }
                },
                 { // Slot is contained within the block
                    startTime: { lte: startTime },
                    endTime: { gte: endTime }
                },
                { // All-day block covering the start time
                    isAllDay: true,
                    startTime: { lte: startOfDay(startTime) },
                    endTime: { gte: startOfDay(startTime) }
                }
            ]
        }
    });

    // More robust check for appointments overlap:
    const existingAppointments = await prisma.appointment.findMany({
        where: {
            professionalId: professionalId,
            status: { notIn: [AppointmentStatus.CANCELLED] },
            date: {
                gte: dayStart, // Limit search to the relevant day
                lt: dayEnd
            }
        },
        include: { service: { select: { duration: true } } }
    });

    let appointmentConflict = false;
    for (const appt of existingAppointments) {
        const apptDuration = parseDuration(appt.service.duration);
        if (apptDuration === null) continue; // Skip if duration is invalid
        const apptStart = appt.date;
        const apptEnd = addMinutes(apptStart, apptDuration);
        // Check for overlap: (SlotStart < ApptEnd) and (SlotEnd > ApptStart)
        if (startTime < apptEnd && endTime > apptStart) {
            appointmentConflict = true;
            break;
        }
    }

    return conflictingBlocks === 0 && !appointmentConflict;
};

