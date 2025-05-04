import { Request, Response, NextFunction } from "express";
import { appointmentRepository } from '../repositories/appointmentRepository';
import { serviceRepository } from '../repositories/serviceRepository'; 
import { professionalRepository } from '../repositories/professionalRepository'; 
import { scheduleBlockRepository } from '../repositories/scheduleBlockRepository'; // Import repository for blocks
import { prisma } from '../utils/prismaClient'; // Import prisma client for direct access if needed
import { Prisma, AppointmentStatus, UserRole } from "@prisma/client"; // Added UserRole
import { parseISO, startOfDay, endOfDay, addMinutes, format, parse, isValid, setHours, setMinutes, setSeconds, getDay, isWithinInterval, differenceInHours, isBefore } from 'date-fns'; // Added differenceInHours and isBefore
import { gamificationService, GamificationEventType } from "../services/gamificationService"; // Import gamification service
import { logActivity } from "../services/activityLogService"; // Import activity log service
import { createNotification } from "../services/notificationService"; // Import notification service

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

// Helper function to check availability
const checkAvailability = async (professionalId: string, start: Date, end: Date): Promise<boolean> => {
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
        const professionalsInCompany = await professionalRepository.findMany({ companyId: companyId }, {}, 0, 1000);
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
    const appointment = await appointmentRepository.findByIdWithProfessional(id); // Fetch professional for auth check
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado' });
      return;
    }

    // Authorization check
    const isOwner = appointment.userId === user?.id;
    const isProfessionalAssigned = appointment.professionalId === user?.id; 
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

    // --- ACTIVITY LOG INTEGRATION START ---
    await logActivity(
        userId,
        'NEW_APPOINTMENT',
        `Você agendou ${service.name} para ${format(appointmentDate, 'dd/MM/yyyy HH:mm')}.`, // Use service name
        { id: newAppointment.id, type: 'Appointment' }
    ).catch(err => console.error("Activity logging failed for NEW_APPOINTMENT:", err));
    // --- ACTIVITY LOG INTEGRATION END ---

    // --- NOTIFICATION INTEGRATION START (Optional: Notify user on PENDING?) ---
    // Example: Notify user that booking is pending confirmation
    // await createNotification(
    //     userId,
    //     'APPOINTMENT_PENDING',
    //     `Seu pedido de agendamento para ${service.name} em ${format(appointmentDate, 'dd/MM/yyyy HH:mm')} está pendente de confirmação.`,
    //     { id: newAppointment.id, type: 'Appointment' }
    // ).catch(err => console.error("Notification creation failed for APPOINTMENT_PENDING:", err));
    // --- NOTIFICATION INTEGRATION END ---

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
    if (error instanceof Error && error.message.includes('Profissional não encontrado')) {
        res.status(404).json({ message: error.message });
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

  if (!Object.values(AppointmentStatus).includes(status)) {
      res.status(400).json({ message: 'Status inválido fornecido.' });
      return;
  }

  try {
    const appointment = await appointmentRepository.findByIdWithService(id); // Fetch service for logging/notification message
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado.' });
      return;
    }

    // --- Authorization & Business Logic for Status Change ---
    const isAdmin = user.role === UserRole.ADMIN;
    const isProfessional = appointment.professionalId === user.id; 
    const isOwner = appointment.userId === user.id;

    let canUpdate = false;
    const currentStatus = appointment.status;
    const now = new Date();
    let logMessage = '';
    let logType = '';
    let notificationMessage = '';
    let notificationType = '';

    switch (status) {
        case AppointmentStatus.CONFIRMED:
            // Only Professional or Admin can confirm a PENDING appointment
            if ((isProfessional || isAdmin) && currentStatus === AppointmentStatus.PENDING) {
                canUpdate = true;
                logType = 'APPOINTMENT_CONFIRMED';
                logMessage = `Seu agendamento para ${appointment.service.name} em ${format(appointment.date, 'dd/MM/yyyy HH:mm')} foi confirmado.`;
                notificationType = 'APPOINTMENT_CONFIRMED';
                notificationMessage = logMessage; // Use the same message for notification
            }
            break;
        case AppointmentStatus.COMPLETED:
            // Only Professional or Admin can complete a CONFIRMED appointment, and only after it has started
            if ((isProfessional || isAdmin) && currentStatus === AppointmentStatus.CONFIRMED && isBefore(appointment.date, now)) {
                 canUpdate = true;
                 logType = 'APPOINTMENT_COMPLETED';
                 logMessage = `Seu agendamento para ${appointment.service.name} em ${format(appointment.date, 'dd/MM/yyyy HH:mm')} foi concluído.`;
                 // No notification needed for completion? Or maybe a "Rate your experience" notification?
                 // --- GAMIFICATION INTEGRATION START ---
                 gamificationService.triggerEvent(appointment.userId, GamificationEventType.APPOINTMENT_COMPLETED, {
                     relatedEntityId: appointment.id,
                     relatedEntityType: "Appointment",
                 }).catch(err => console.error("Gamification event trigger failed for APPOINTMENT_COMPLETED:", err));
                 // --- GAMIFICATION INTEGRATION END ---
            }
            break;
        case AppointmentStatus.CANCELLED:
            // Use the dedicated cancel endpoint for cancellation logic
            res.status(400).json({ message: 'Use o endpoint PATCH /api/appointments/{id}/cancel para cancelar.' });
            return; // Prevent using this endpoint for cancellation
        case AppointmentStatus.PENDING:
             if (isAdmin) {
                 canUpdate = true;
             } else {
                 res.status(403).json({ message: 'Não autorizado a redefinir o status para pendente.' });
                 return;
             }
             break;
        default:
            res.status(400).json({ message: `Atualização para o status '${status}' não suportada ou não permitida.` });
            return;
    }

    if (!canUpdate) {
        res.status(403).json({ message: `Não autorizado a mudar o status de ${currentStatus} para ${status} ou condição não atendida.` });
        return;
    }

    const updatedAppointment = await appointmentRepository.update(id, { status });

    // --- ACTIVITY LOG INTEGRATION START ---
    if (logType && logMessage) {
        await logActivity(
            appointment.userId, // Log for the user who booked
            logType,
            logMessage,
            { id: updatedAppointment.id, type: 'Appointment' }
        ).catch(err => console.error(`Activity logging failed for ${logType}:`, err));
    }
    // --- ACTIVITY LOG INTEGRATION END ---

    // --- NOTIFICATION INTEGRATION START ---
    if (notificationType && notificationMessage) {
        await createNotification(
            appointment.userId, // Notify the user who booked
            notificationType,
            notificationMessage,
            { id: updatedAppointment.id, type: 'Appointment' }
        ).catch(err => console.error(`Notification creation failed for ${notificationType}:`, err));
    }
    // --- NOTIFICATION INTEGRATION END ---

    res.json(updatedAppointment);

  } catch (error) {
    console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ message: 'Agendamento não encontrado para atualização de status.' });
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
        const appointment = await appointmentRepository.findByIdWithService(id); // Fetch service for logging/notification
        if (!appointment) {
            res.status(404).json({ message: 'Agendamento não encontrado.' });
            return;
        }

        // --- Authorization & Business Logic for Cancellation ---
        const isAdmin = user.role === UserRole.ADMIN;
        const isProfessional = appointment.professionalId === user.id;
        const isOwner = appointment.userId === user.id;
        const now = new Date();
        const hoursUntilAppointment = differenceInHours(appointment.date, now);

        let canCancel = false;

        if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.COMPLETED) {
            res.status(200).json({ message: 'Agendamento já está cancelado ou concluído.', appointment });
            return;
        }

        // Owner can cancel PENDING or CONFIRMED if enough notice is given
        if (isOwner && (appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.CONFIRMED)) {
            if (hoursUntilAppointment >= MIN_CANCELLATION_HOURS) {
                canCancel = true;
            } else {
                res.status(403).json({ message: `Cancelamento não permitido. É necessário cancelar com pelo menos ${MIN_CANCELLATION_HOURS} hora(s) de antecedência.` });
                return;
            }
        }
        // Professional or Admin can cancel PENDING or CONFIRMED anytime
        else if ((isProfessional || isAdmin) && (appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.CONFIRMED)) {
            canCancel = true;
        }

        if (!canCancel) {
            res.status(403).json({ message: 'Não autorizado a cancelar este agendamento ou status inválido para cancelamento.' });
            return;
        }

        const updatedAppointment = await appointmentRepository.update(id, { status: AppointmentStatus.CANCELLED });

        // --- ACTIVITY LOG INTEGRATION START ---
        const logType = 'APPOINTMENT_CANCELLED';
        const logMessage = `Seu agendamento para ${appointment.service.name} em ${format(appointment.date, 'dd/MM/yyyy HH:mm')} foi cancelado.`;
        await logActivity(
            appointment.userId, // Log for the user who booked
            logType,
            logMessage,
            { id: updatedAppointment.id, type: 'Appointment' }
        ).catch(err => console.error(`Activity logging failed for ${logType}:`, err));
        // --- ACTIVITY LOG INTEGRATION END ---

        // --- NOTIFICATION INTEGRATION START ---
        const notificationType = 'APPOINTMENT_CANCELLED';
        const notificationMessage = logMessage; // Use the same message
        await createNotification(
            appointment.userId, // Notify the user who booked
            notificationType,
            notificationMessage,
            { id: updatedAppointment.id, type: 'Appointment' }
        ).catch(err => console.error(`Notification creation failed for ${notificationType}:`, err));
        // --- NOTIFICATION INTEGRATION END ---

        res.json({ message: 'Agendamento cancelado com sucesso.', appointment: updatedAppointment });

    } catch (error) {
        console.error(`Erro ao cancelar agendamento ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Agendamento não encontrado para cancelamento.' });
            return;
        }
        next(error);
    }
};

