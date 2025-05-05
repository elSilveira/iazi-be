import { Request, Response, NextFunction } from "express";
import { appointmentRepository } from '../repositories/appointmentRepository';
import { serviceRepository } from '../repositories/serviceRepository'; 
import { professionalRepository } from '../repositories/professionalRepository'; 
import { scheduleBlockRepository } from '../repositories/scheduleBlockRepository'; // Import repository for blocks
import { prisma } from "../lib/prisma"; // Import prisma client for direct access if needed
import { Prisma, AppointmentStatus, UserRole } from "@prisma/client"; // Added UserRole
import { parseISO, startOfDay, endOfDay, addMinutes, format, parse, isValid, setHours, setMinutes, setSeconds, getDay, isWithinInterval, differenceInHours, isBefore } from 'date-fns'; // Added differenceInHours and isBefore
import { gamificationService, GamificationEventType } from "../services/gamificationService"; // Import gamification service
import { logActivity } from "../services/activityLogService"; // Import activity log service
// import { createNotification } from "../services/notificationService"; // Import notification service (Removed)

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
export const MIN_BOOKING_ADVANCE_HOURS = 1; // Minimum hours in advance to book
export const MIN_CANCELLATION_HOURS = 2; // Minimum hours notice required to cancel

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Helper function to parse duration string (e.g., "60min", "1h", "1h30min") into minutes
export const parseDuration = (duration: string): number | null => {
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

export const getWorkingHoursForDay = (workingHoursJson: any, date: Date): { start: Date; end: Date } | null => {
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

// Helper function to check availability
export const checkAvailability = async (professionalId: string, start: Date, end: Date): Promise<boolean> => {
    // 1. Check Professional's Working Hours
    const professional = await professionalRepository.findById(professionalId);
    if (!professional) throw new Error('Profissional não encontrado para verificação de disponibilidade.');

    // Use professional's specific hours, fallback to company hours if needed (logic depends on requirements)
    const workingHoursJson = professional.workingHours || (professional.company ? professional.company.workingHours : null);
    const workingHoursToday = getWorkingHoursForDay(workingHoursJson, start);

    if (!workingHoursToday) {
        console.log(`Availability Check: No working hours defined for professional ${professionalId} on ${format(start, 'yyyy-MM-dd')}`);
        return false; // Not working on this day
    }

    // Check if requested slot is within working hours
    if (!isWithinInterval(start, { start: workingHoursToday.start, end: workingHoursToday.end }) ||
        !isWithinInterval(end, { start: workingHoursToday.start, end: workingHoursToday.end })) {
        console.log(`Availability Check: Requested slot ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')} is outside working hours ${format(workingHoursToday.start, 'HH:mm')} - ${format(workingHoursToday.end, 'HH:mm')}`);
        return false;
    }

    // 2. Check for Conflicting Appointments
    const conflictingAppointments = await appointmentRepository.findMany({
        professionalId: professionalId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }, // Check against pending and confirmed
        OR: [
            { date: { lt: end }, AND: { date: { gte: start } } }, // Starts during the slot
            // A more precise check requires knowing the end time of existing appointments:
            // date < requestedEnd && calculatedEndTime > requestedStart
            // Simplified check: Check if any appointment STARTS within the potential conflict window
            { date: { gt: start, lt: end } } // Existing appointment starts within the requested slot
        ],
    });

    if (conflictingAppointments.length > 0) {
        console.log(`Availability Check: Found ${conflictingAppointments.length} conflicting appointments for professional ${professionalId} between ${format(start, 'HH:mm')} and ${format(end, 'HH:mm')}`);
        return false;
    }

    // 3. Check for Schedule Blocks
    const conflictingBlocks = await scheduleBlockRepository.findMany({
        professionalId: professionalId,
        startTime: { lt: end },
        endTime: { gt: start },
    });

    if (conflictingBlocks.length > 0) {
        console.log(`Availability Check: Found ${conflictingBlocks.length} conflicting schedule blocks for professional ${professionalId} between ${format(start, 'HH:mm')} and ${format(end, 'HH:mm')}`);
        return false;
    }

    return true; // Available
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
        // Filter by professionals within that company
        const professionalsInCompany = await professionalRepository.findMany({ companyId: companyId }, undefined, { skip: 0, take: 1000 });
        const professionalIds = professionalsInCompany.map(p => p.id);
        if (professionalIds.length > 0) {
            if (filters.professionalId) {
                // Ensure professional belongs to company if both are given
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

    // Ensure context for non-admins
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
    const appointment = await appointmentRepository.findById(id); // Use basic findById
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado' });
      return;
    }

    // Authorization check
    const isOwner = appointment.user?.id === user?.id;
    // Check if the logged-in user is the professional assigned to the appointment
    // This requires linking the Professional profile to a User account (e.g., via professional.userId)
    // Assuming professional.userId exists and matches req.user.id
    const isProfessionalAssigned = appointment.professional?.userId === user?.id; 
    const isAdmin = user?.role === UserRole.ADMIN;
    
    if (!isOwner && !isProfessionalAssigned && !isAdmin) {
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

  let service: any; // Declare service outside try block
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
    service = await serviceRepository.findById(serviceId); // Assign service here
    const duration = service ? parseDuration(service.duration) : null;
    if (!service || duration === null) {
        res.status(404).json({ message: 'Serviço não encontrado ou duração inválida.' });
        return;
    }
    const appointmentEnd = addMinutes(appointmentDate, duration);

    // Fetch professional (required for availability check)
    let targetProfessionalId = professionalId;
    if (!targetProfessionalId) {
        // If professionalId is not provided, find one who offers the service
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
        // If professionalId IS provided, validate it
        if (!isValidUUID(targetProfessionalId)) {
            res.status(400).json({ message: 'Formato de professionalId inválido.' });
            return;
        }
        // Validate that the specified professional actually offers the service
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
      status: AppointmentStatus.PENDING, // Default status
      notes: notes,
      professional: { connect: { id: targetProfessionalId } } // Connect determined professional
    };
    
    const newAppointment = await appointmentRepository.create(dataToCreate);

    // --- ACTIVITY LOG & NOTIFICATION ---
    try {
        await logActivity(userId, "NEW_APPOINTMENT", {
            message: `Você agendou ${service.name} para ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`,
            relatedEntityId: newAppointment.id,
            relatedEntityType: "Appointment"
        });
        // Notify professional/company? (Example)
        // await createNotification(targetProfessionalId, "NEW_APPOINTMENT_REQUEST", {
        //     message: `Novo agendamento de ${req.user?.name} para ${service.name} em ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`,
        //     relatedEntityId: newAppointment.id
        // });
    } catch (logError) {
        console.error("Error logging activity or sending notification:", logError);
        // Don't fail the request, just log the error
    }
    // --- END ACTIVITY LOG & NOTIFICATION ---

    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Handle cases where service or professional might not be found during connect
        res.status(404).json({ message: `Erro ao criar agendamento: ${error.meta?.cause || 'Serviço ou Profissional não encontrado.'}` });
    } else {
        next(error);
    }
  }
};

// Atualizar status de um agendamento (Confirmar, Cancelar, Completar)
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user;

  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  if (!status || !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    res.status(400).json({ 
      message: 'Status inválido. Valores permitidos: ' + Object.values(AppointmentStatus).join(', ') 
    });
    return;
  }

  try {
    const appointment = await appointmentRepository.findByIdWithService(id); // Include service for logging
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado' });
      return;
    }

    const currentStatus = appointment.status;
    const newStatus = status as AppointmentStatus;
    const isAdmin = user?.role === UserRole.ADMIN;
    const isOwner = appointment.userId === user?.id;
    // TODO: Add check if user is the professional or company owner

    // --- Authorization & Status Transition Logic ---
    let allowed = false;
    let activityType: string | null = null;
    let activityMessage: string | null = null;
    let gamificationEvent: GamificationEventType | null = null;

    switch (newStatus) {
      case AppointmentStatus.CONFIRMED:
        if (isAdmin && currentStatus === AppointmentStatus.PENDING) {
          allowed = true;
          activityType = "APPOINTMENT_CONFIRMED";
          activityMessage = `Seu agendamento de ${appointment.service.name} para ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi confirmado.`;
        }
        break;
      case AppointmentStatus.CANCELLED:
        const now = new Date();
        const hoursUntilAppointment = differenceInHours(appointment.date, now);
        
        if (isAdmin) {
            allowed = true; // Admin can always cancel
        } else if (isOwner && (currentStatus === AppointmentStatus.PENDING || currentStatus === AppointmentStatus.CONFIRMED)) {
            if (hoursUntilAppointment >= MIN_CANCELLATION_HOURS) {
                allowed = true;
            } else {
                res.status(400).json({ message: `Não é possível cancelar com menos de ${MIN_CANCELLATION_HOURS} horas de antecedência.` });
                return;
            }
        }
        if (allowed) {
            activityType = "APPOINTMENT_CANCELLED";
            activityMessage = `Seu agendamento de ${appointment.service.name} para ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi cancelado.`;
        }
        break;
      case AppointmentStatus.COMPLETED:
        // Only Admin or Professional can mark as completed?
        if (isAdmin && currentStatus === AppointmentStatus.CONFIRMED) {
          allowed = true;
          activityType = "APPOINTMENT_COMPLETED";
          activityMessage = `Seu agendamento de ${appointment.service.name} em ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi concluído.`;
          gamificationEvent = GamificationEventType.APPOINTMENT_COMPLETED;
        }
        break;
      case AppointmentStatus.NO_SHOW:
        // Only Admin or Professional?
        if (isAdmin && currentStatus === AppointmentStatus.CONFIRMED) {
          allowed = true;
          activityType = "APPOINTMENT_NO_SHOW";
          activityMessage = `Você não compareceu ao agendamento de ${appointment.service.name} em ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")}.`;
          // Consider gamification penalty?
        }
        break;
      case AppointmentStatus.PENDING:
        // Generally shouldn't transition back to PENDING, maybe admin override?
        if (isAdmin && currentStatus === AppointmentStatus.CANCELLED) { // Example: Admin reopens a cancelled appointment
            allowed = true;
            // Log this specific action?
        }
        break;
    }

    if (!allowed) {
      res.status(403).json({ message: `Transição de status inválida de ${currentStatus} para ${newStatus} ou permissão insuficiente.` });
      return;
    }
    // --- End Authorization & Status Transition Logic ---

    const updatedAppointment = await appointmentRepository.update(id, { status: newStatus });

    // --- ACTIVITY LOG, NOTIFICATION & GAMIFICATION ---
    try {
        if (activityType && activityMessage) {
            await logActivity(appointment.userId, activityType, {
                message: activityMessage,
                relatedEntityId: id,
                relatedEntityType: "Appointment"
            });
            // Notify user about the status change
            // await createNotification(appointment.userId, activityType, {
            //     message: activityMessage,
            //     relatedEntityId: id
            // });
        }
        if (gamificationEvent) {
            await gamificationService.triggerEvent(appointment.userId, gamificationEvent, { relatedEntityId: id });
        }
    } catch (logError) {
        console.error("Error logging activity, sending notification, or triggering gamification:", logError);
        // Don't fail the request
    }
    // --- END ACTIVITY LOG, NOTIFICATION & GAMIFICATION ---

    res.json(updatedAppointment);
  } catch (error) {
    console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
    next(error);
  }
};

// Obter horários disponíveis para um serviço/profissional em uma data específica
export const getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { date, serviceId, professionalId, companyId } = req.query;

    if (!date || typeof date !== 'string') {
        res.status(400).json({ message: "Parâmetro 'date' (YYYY-MM-DD) é obrigatório." });
        return;
    }
    if (!serviceId || typeof serviceId !== 'string' || !isValidUUID(serviceId)) {
        res.status(400).json({ message: "Parâmetro 'serviceId' (UUID) é obrigatório." });
        return;
    }
    if (!professionalId && !companyId) {
        res.status(400).json({ message: "É necessário fornecer 'professionalId' ou 'companyId'." });
        return;
    }
    if (professionalId && (typeof professionalId !== 'string' || !isValidUUID(professionalId))) {
        res.status(400).json({ message: "Formato de 'professionalId' inválido." });
        return;
    }
    if (companyId && (typeof companyId !== 'string' || !isValidUUID(companyId))) {
        res.status(400).json({ message: "Formato de 'companyId' inválido." });
        return;
    }

    try {
        const targetDate = parse(date, 'yyyy-MM-dd', new Date());
        if (!isValid(targetDate)) {
            res.status(400).json({ message: "Formato de data inválido. Use YYYY-MM-DD." });
            return;
        }

        const service = await serviceRepository.findById(serviceId);
        const duration = service ? parseDuration(service.duration) : null;
        if (!service || duration === null) {
            res.status(404).json({ message: "Serviço não encontrado ou duração inválida." });
            return;
        }

        let professionalsToCheck: { id: string; workingHours: any; company?: { workingHours: any } | null }[] = [];

        if (professionalId) {
            const professional = await professionalRepository.findById(professionalId);
            if (!professional) {
                res.status(404).json({ message: "Profissional não encontrado." });
                return;
            }
            // Check if this professional offers the service
            const profServiceLink = await prisma.professionalService.findUnique({
                where: { professionalId_serviceId: { professionalId: professionalId, serviceId: serviceId } }
            });
            if (!profServiceLink) {
                 res.status(400).json({ message: "O profissional especificado não oferece este serviço." });
                 return;
            }
            professionalsToCheck.push(professional);
        } else if (companyId) {
            // Find professionals in the company who offer the service
            const profServices = await prisma.professionalService.findMany({
                where: { serviceId: serviceId, professional: { companyId: companyId } },
                include: { professional: { include: { company: true } } } // Include company for working hours fallback
            });
            professionalsToCheck = profServices.map(ps => ps.professional);
            if (professionalsToCheck.length === 0) {
                 res.json({ availableSlots: [] }); // No professionals in this company offer this service
                 return;
            }
        }

        // --- Availability Calculation --- 
        const allAvailableSlots: { [professionalId: string]: string[] } = {}; // Store slots per professional
        const intervalMinutes = 15; // Slot interval

        for (const prof of professionalsToCheck) {
            const profId = prof.id;
            allAvailableSlots[profId] = [];
            const workingHoursJson = prof.workingHours || (prof.company ? prof.company.workingHours : null);
            const workingHoursToday = getWorkingHoursForDay(workingHoursJson, targetDate);

            if (!workingHoursToday) continue; // Skip if not working

            // Get existing appointments and blocks for this professional on this day
            const dayStart = startOfDay(targetDate);
            const dayEnd = endOfDay(targetDate);
            const existingAppointments = await appointmentRepository.findMany({
                professionalId: profId,
                status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
                date: { gte: dayStart, lt: dayEnd },
            });
            const scheduleBlocks = await scheduleBlockRepository.findMany({
                professionalId: profId,
                startTime: { lt: dayEnd },
                endTime: { gt: dayStart },
            });

            // Iterate through potential slots
            let currentSlotStart = workingHoursToday.start;
            while (currentSlotStart < workingHoursToday.end) {
                const potentialSlotEnd = addMinutes(currentSlotStart, duration);

                // Check if slot END is within working hours
                if (potentialSlotEnd > workingHoursToday.end) {
                    break; // No more possible slots
                }

                let isSlotAvailable = true;

                // Check against existing appointments
                for (const appt of existingAppointments) {
                    const apptDuration = await serviceRepository.findById(appt.serviceId).then(s => s ? parseDuration(s.duration) : 0) || 0;
                    const apptEnd = addMinutes(appt.date, apptDuration);
                    // Check for overlap: (SlotStart < ApptEnd) and (SlotEnd > ApptStart)
                    if (currentSlotStart < apptEnd && potentialSlotEnd > appt.date) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (!isSlotAvailable) {
                    currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
                    continue;
                }

                // Check against schedule blocks
                for (const block of scheduleBlocks) {
                    // Check for overlap: (SlotStart < BlockEnd) and (SlotEnd > BlockStart)
                    if (currentSlotStart < block.endTime && potentialSlotEnd > block.startTime) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (!isSlotAvailable) {
                    currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
                    continue;
                }

                // If available, add to list
                allAvailableSlots[profId].push(format(currentSlotStart, 'HH:mm'));

                // Move to the next potential slot
                currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
            }
        }

        // Format response based on input (single professional or company)
        if (professionalId) {
            res.json({ availableSlots: allAvailableSlots[professionalId] || [] });
        } else {
            // For company, return slots grouped by professional or a combined list?
            // Returning grouped by professional ID for now
            res.json({ availabilityByProfessional: allAvailableSlots });
        }

    } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
        next(error);
    }
};

