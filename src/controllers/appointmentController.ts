import { Request, Response, NextFunction } from "express";
import { appointmentRepository } from '../repositories/appointmentRepository';
import { serviceRepository } from '../repositories/serviceRepository'; 
import { professionalRepository } from '../repositories/professionalRepository'; 
import { scheduleBlockRepository } from '../repositories/scheduleBlockRepository'; // Import repository for blocks
import { prisma } from "../lib/prisma"; // Import prisma client for direct access if needed
import { Prisma, AppointmentStatus, UserRole, Professional, Appointment, Service, Company, CompanyAddress } from "@prisma/client"; // Removed Address, added CompanyAddress
import { parseISO, startOfDay, endOfDay, addMinutes, format, parse, isValid, setHours, setMinutes, setSeconds, getDay, isWithinInterval, differenceInHours, isBefore } from 'date-fns'; // Added differenceInHours and isBefore
import { gamificationService, GamificationEventType } from "../services/gamificationService"; // Import gamification service
import { logActivity } from "../services/activityLogService"; // Import activity log service
// import { createNotification } from "../services/notificationService"; // Import notification service (Removed)

// Define payload types for relations based on repository includes
type ProfessionalWithDetails = Prisma.ProfessionalGetPayload<{
  include: { 
    services: { include: { service: true } },
    company: { include: { address: true } } 
  }
}>

type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: { 
    service: true, 
    professional: { 
      include: { 
        company: true // Include company if needed for professional context
      }
    }, 
    user: { select: { id: true, name: true, email: true, avatar: true } }
  }
}>

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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Helper function to parse duration string (e.g., "PT1H30M") to minutes
export const parseDuration = (durationString: string | null): number | null => {
    if (!durationString) return null;
    // Updated regex to handle ISO 8601 duration format (PTnHnM)
    const match = durationString.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
    if (!match) {
        // Fallback for simple formats like "30m", "1h", "1h30m" (less robust)
        let totalMinutes = 0;
        const hourMatch = durationString.match(/(\d+)h/);
        const minMatch = durationString.match(/(\d+)m/);
        if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
        if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
        return totalMinutes > 0 ? totalMinutes : null;
    }
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
};

// Helper function to get working hours for a specific day
export const getWorkingHoursForDay = (workingHoursJson: Prisma.JsonValue | null | undefined, date: Date): { start: Date, end: Date } | null => {
    // Check if workingHoursJson is a valid object and not null/undefined
    if (!workingHoursJson || typeof workingHoursJson !== 'object' || Array.isArray(workingHoursJson)) return null;

    const dayOfWeek = getDay(date); // 0 (Sunday) to 6 (Saturday)
    const dayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayOfWeek];

    // Type assertion to treat workingHoursJson as an indexable object
    const hoursData = (workingHoursJson as { [key: string]: any })[dayKey];

    if (!hoursData || typeof hoursData !== 'object' || !hoursData.start || !hoursData.end || !hoursData.isOpen) {
        return null; // Not open or hours not defined correctly
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(hoursData.start) || !timeRegex.test(hoursData.end)) {
        console.error(`Invalid time format in working hours for ${dayKey}: start=${hoursData.start}, end=${hoursData.end}`);
        return null;
    }

    const [startHour, startMinute] = hoursData.start.split(':').map(Number);
    const [endHour, endMinute] = hoursData.end.split(':').map(Number);

    const startTime = setSeconds(setMinutes(setHours(date, startHour), startMinute), 0);
    const endTime = setSeconds(setMinutes(setHours(date, endHour), endMinute), 0);

    // Ensure end time is after start time
    if (endTime <= startTime) {
        console.warn(`Working hours end time is not after start time for ${dayKey}. Adjusting end time to next day if necessary or ignoring.`);
        // Handle overnight logic if needed, or simply return null/invalid
        return null; // Or adjust endTime logic based on business rules
    }

    return { start: startTime, end: endTime };
};

// Helper function to check availability
export const checkAvailability = async (professionalId: string, start: Date, end: Date): Promise<boolean> => {
    // 1. Check Professional's Working Hours
    // Use the corrected payload type
    const professional: ProfessionalWithDetails | null = await professionalRepository.findById(professionalId);
    if (!professional) throw new Error('Profissional não encontrado para verificação de disponibilidade.');

    // Use professional's specific hours, fallback to company hours if needed
    const workingHoursJson = professional.workingHours || professional.company?.workingHours || null;
    const workingHoursToday = getWorkingHoursForDay(workingHoursJson, start);

    if (!workingHoursToday) {
        console.log(`Availability Check: No working hours defined for professional ${professionalId} on ${format(start, 'yyyy-MM-dd')}`);
        return false; // Not working on this day
    }

    // Check if the requested slot [start, end) is within the working hours [start, end)
    if (!isWithinInterval(start, { start: workingHoursToday.start, end: workingHoursToday.end }) ||
        !isWithinInterval(addMinutes(end, -1), { start: workingHoursToday.start, end: workingHoursToday.end })) { // Check end-1 minute to ensure end is not exclusive
        console.log(`Availability Check: Slot [${format(start, 'HH:mm')}, ${format(end, 'HH:mm')}) is outside working hours [${format(workingHoursToday.start, 'HH:mm')}, ${format(workingHoursToday.end, 'HH:mm')})`);
        return false;
    }

    // 2. Check for Conflicting Appointments
    const conflictingAppointments = await appointmentRepository.findMany({
        professionalId: professionalId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        // Check for appointments that overlap with the requested slot [start, end)
        // Overlap condition: (ApptStart < end) and (ApptEnd > start)
        date: { lt: end }, // Appointments starting before the requested slot ends
        // We need ApptEnd > start. ApptEnd = ApptDate + ApptDuration.
        // This requires fetching duration or calculating it. Simpler: check appointments starting within the potential conflict window.
        // Let's refine the query later if needed, for now, check appointments starting before 'end'
    });

    for (const appt of conflictingAppointments) {
        const apptService = await serviceRepository.findById(appt.serviceId);
        const apptDuration = apptService ? parseDuration(apptService.duration) : 0;
        if (apptDuration === null || apptDuration <= 0) continue; // Skip if duration is invalid
        const apptEnd = addMinutes(appt.date, apptDuration);

        // Check for overlap: (appt.date < end) and (apptEnd > start)
        if (isBefore(appt.date, end) && isBefore(start, apptEnd)) {
            console.log(`Availability Check: Conflict with existing appointment ${appt.id} [${format(appt.date, 'HH:mm')}, ${format(apptEnd, 'HH:mm')})`);
            return false;
        }
    }

    // 3. Check for Schedule Blocks
    const conflictingBlocks = await scheduleBlockRepository.findMany({
        where: {
            professionalId: professionalId,
            startTime: { lt: end },
            endTime: { gt: start },
        }
    });

    if (conflictingBlocks.length > 0) {
        console.log(`Availability Check: Found ${conflictingBlocks.length} conflicting schedule blocks for professional ${professionalId} between ${format(start, 'HH:mm')} and ${format(end, 'HH:mm')}`);
        return false;
    }

    console.log(`Availability Check: Slot [${format(start, 'HH:mm')}, ${format(end, 'HH:mm')}) is available for professional ${professionalId}`);
    return true; // Slot is available
};

// --- CONTROLLER METHODS ---

// Criar um novo agendamento
export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { serviceId, professionalId, companyId, date, time, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    // --- Input Validation ---
    if (!serviceId || !isValidUUID(serviceId)) {
        return res.status(400).json({ message: 'ID do serviço inválido.' });
    }
    if (!date || !time) {
        return res.status(400).json({ message: 'Data e hora são obrigatórios.' });
    }
    if (!professionalId && !companyId) {
        return res.status(400).json({ message: 'É necessário fornecer ID do profissional ou da empresa.' });
    }
    if (professionalId && !isValidUUID(professionalId)) {
        return res.status(400).json({ message: 'ID do profissional inválido.' });
    }
    if (companyId && !isValidUUID(companyId)) {
        return res.status(400).json({ message: 'ID da empresa inválido.' });
    }

    let targetProfessionalId = professionalId;

    try {
        // --- Date/Time Parsing and Validation ---
        const appointmentDateTimeString = `${date}T${time}:00`; // Assume local time if no timezone provided
        const appointmentDate = parseISO(appointmentDateTimeString); // Use parseISO for better timezone handling if the string is ISO 8601

        if (!isValid(appointmentDate)) {
            return res.status(400).json({ message: 'Formato de data/hora inválido. Use YYYY-MM-DD e HH:MM.' });
        }

        // Check if booking is in the past
        if (isBefore(appointmentDate, addMinutes(new Date(), -5))) { // Allow 5 min buffer
            return res.status(400).json({ message: 'Não é possível agendar no passado.' });
        }

        // Check if booking too far in advance (e.g., > 90 days)
        // if (differenceInDays(appointmentDate, new Date()) > 90) { ... }

        // Check minimum booking advance time
        if (differenceInHours(appointmentDate, new Date()) < MIN_BOOKING_ADVANCE_HOURS) {
            return res.status(400).json({ message: `O agendamento deve ser feito com pelo menos ${MIN_BOOKING_ADVANCE_HOURS} hora(s) de antecedência.` });
        }

        // --- Entity Validation & Selection ---
        const service = await serviceRepository.findById(serviceId);
        const durationMinutes = service ? parseDuration(service.duration) : null;

        if (!service || durationMinutes === null || durationMinutes <= 0) {
            return res.status(404).json({ message: 'Serviço não encontrado ou duração inválida.' });
        }

        if (!targetProfessionalId && companyId) {
            // TODO: Implement logic to select an available professional from the company for the service
            // This might involve checking which professionals offer the service and their availability
            // For now, require professionalId
            return res.status(400).json({ message: 'Seleção automática de profissional não implementada. Forneça professionalId.' });
            // Example: Find professionals in company offering the service
            // const professionals = await professionalRepository.findMany({ companyId, services: { some: { serviceId } } }, ...);
            // Then check availability for each...
        }

        // Ensure the selected professional exists and offers the service
        const professionalExists = await prisma.professional.findFirst({
            where: {
                id: targetProfessionalId,
                ...(companyId && { companyId: companyId }), // Optional: ensure professional is in the company if companyId is given
                services: { some: { serviceId: serviceId } }
            }
        });

        if (!professionalExists) {
            return res.status(404).json({ message: 'Profissional não encontrado, não pertence à empresa ou não oferece o serviço selecionado.' });
        }

        // --- Availability Check ---
        const appointmentEnd = addMinutes(appointmentDate, durationMinutes);
        const isAvailable = await checkAvailability(targetProfessionalId, appointmentDate, appointmentEnd);

        if (!isAvailable) {
            return res.status(409).json({ message: 'Horário indisponível. Conflito com agendamento existente, bloqueio ou fora do horário de trabalho.' });
        }

        // --- Create Appointment ---
        const dataToCreate: Prisma.AppointmentCreateInput = {
            user: { connect: { id: userId } },
            service: { connect: { id: serviceId } },
            professional: { connect: { id: targetProfessionalId } },
            date: appointmentDate,
            status: AppointmentStatus.PENDING, // Default status
            notes: notes || null,
        };

        const newAppointment = await appointmentRepository.create(dataToCreate);

        // --- ACTIVITY LOG & NOTIFICATION ---
        try {
            await logActivity(userId, "NEW_APPOINTMENT", `Você agendou ${service.name} para ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`, {
                id: newAppointment.id,
                type: "Appointment"
            });
            // Notify professional/company? (Example)
            // await createNotification(targetProfessionalId, "NEW_APPOINTMENT_REQUEST", {
            //     message: `Novo agendamento de ${req.user?.name} para ${service.name} em ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`,
            //     relatedEntityId: newAppointment.id
            // });
        } catch (logError) {
            console.error("Error logging activity or sending notification:", logError);
            // Don't fail the request because of logging/notification error
        }

        // --- GAMIFICATION --- 
        try {
            await gamificationService.triggerEvent(userId, GamificationEventType.APPOINTMENT_BOOKED, { relatedEntityId: newAppointment.id });
        } catch (gamificationError) {
            console.error("Error triggering gamification event:", gamificationError);
        }

        return res.status(201).json(newAppointment);

    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        next(error); // Pass error to global error handler
    }
};

// Listar agendamentos (com filtros)
export const listAppointments = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const user = req.user;
    const { professionalId, companyId, userId: queryUserId, status, date } = req.query;

    if (!user) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
        let filters: Prisma.AppointmentWhereInput = {};

        // Security: Non-admins can only see their own appointments unless querying by professional/company
        if (user.role !== UserRole.ADMIN && !professionalId && !companyId) {
            filters.userId = user.id;
        } else if (user.role === UserRole.ADMIN && queryUserId && typeof queryUserId === 'string') {
            if (isValidUUID(queryUserId)) {
                 filters.userId = queryUserId; // Admin can filter by userId
            } else {
                 return res.status(400).json({ message: 'Formato de userId inválido.' });
            }
        }

        if (professionalId && typeof professionalId === 'string') {
             if (isValidUUID(professionalId)) {
                 filters.professionalId = professionalId;
             } else {
                 return res.status(400).json({ message: 'Formato de professionalId inválido.' });
             }
        }
        if (status && typeof status === 'string' && status in AppointmentStatus) {
            filters.status = status as AppointmentStatus;
        }
        if (date && typeof date === 'string') {
            const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
            if (isValid(parsedDate)) {
                filters.date = {
                    gte: startOfDay(parsedDate),
                    lt: endOfDay(parsedDate),
                };
            } else {
                 return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
            }
        }
        if (companyId && typeof companyId === 'string') {
            if (!isValidUUID(companyId)) {
                 return res.status(400).json({ message: 'Formato de companyId inválido.' });
            }
            // Filter by professionals within that company
            // Ensure findMany takes correct parameters: filters, orderBy, skip, take
            const professionalsInCompany = await professionalRepository.findMany({ companyId: companyId }, {}, 0, 1000); 
            const professionalIds = professionalsInCompany.map(p => p.id);
            if (professionalIds.length > 0) {
                // If professionalId filter already exists, ensure it's one of the company's professionals
                if (filters.professionalId && typeof filters.professionalId === 'string') {
                    if (!professionalIds.includes(filters.professionalId)) {
                        // Professional not in company, return empty list
                        return res.json([]);
                    }
                } else {
                    // Otherwise, filter by all professionals in the company
                    filters.professionalId = { in: professionalIds };
                }
            } else {
                // No professionals in company, return empty list
                return res.json([]);
            }
        }

        const appointments = await appointmentRepository.findMany(filters);
        return res.json(appointments);

    } catch (error) {
        console.error("Erro ao listar agendamentos:", error);
        next(error);
    }
};

// Obter detalhes de um agendamento específico
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    if (!isValidUUID(id)) {
        return res.status(400).json({ message: 'ID de agendamento inválido.' });
    }

    try {
        // Use the corrected payload type
        const appointment: AppointmentWithDetails | null = await appointmentRepository.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }

        // Authorization check
        const isOwner = appointment.userId === user?.id;
        // Check if the logged-in user is the assigned professional
        // This requires linking Professional to User or checking company ownership etc.
        // Simplified check: Is the logged-in user associated with the professional's company (if applicable)?
        // This logic needs refinement based on actual authorization requirements.
        let isProfessionalOrRelated = false;
        if (appointment.professionalId) {
             // Example: Check if user's ID matches a potential userId field on Professional (if added)
             // Or check if user is admin/owner of the professional's company
             // const professionalDetails = await professionalRepository.findById(appointment.professionalId);
             // if (professionalDetails?.companyId === user.companyId) { isProfessionalOrRelated = true; }
             // For now, let's assume only ADMIN can see others' appointments besides the owner.
        }
        const isAdmin = user?.role === UserRole.ADMIN;
        
        if (!isOwner && !isAdmin) { // Simplified: Only owner or admin can view
            return res.status(403).json({ message: 'Não autorizado a ver este agendamento.' });
        }

        return res.json(appointment);

    } catch (error) {
        console.error(`Erro ao buscar agendamento ${id}:`, error);
        next(error);
    }
};

// Utility: Check if user is the professional or (future: company admin/owner)
async function isProfessionalOrCompanyAdmin(user: { id: string; role: UserRole }, appointment: AppointmentWithDetails): Promise<boolean> {
  if (!user || !appointment) return false;
  // Check if user is the professional (by userId on Professional)
  if (appointment.professional && appointment.professional.userId && appointment.professional.userId === user.id) {
    return true;
  }
  // Future: Add company admin/owner logic here if schema supports it
  return false;
}

// Atualizar status de um agendamento (confirmar, cancelar, concluir)
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    if (!isValidUUID(id)) {
        return res.status(400).json({ message: 'ID de agendamento inválido.' });
    }
    if (!status || !(status in AppointmentStatus)) {
        return res.status(400).json({ message: 'Status inválido fornecido.' });
    }

    try {
        const appointment: AppointmentWithDetails | null = await appointmentRepository.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        const currentStatus = appointment.status;
        const newStatus = status as AppointmentStatus;
        const isAdmin = user?.role === UserRole.ADMIN;
        const isOwner = appointment.userId === user?.id;
        // Implement real check for professional or company admin
        const isProfOrCompanyAdmin = await isProfessionalOrCompanyAdmin(user, appointment);

        let allowed = false;
        let activityType: string | null = null;
        let activityMessage: string | null = null;
        let gamificationEvent: GamificationEventType | null = null;

        switch (newStatus) {
            case AppointmentStatus.CONFIRMED:
                if ((isAdmin || isProfOrCompanyAdmin) && currentStatus === AppointmentStatus.PENDING) {
                    allowed = true;
                    activityType = "APPOINTMENT_CONFIRMED";
                    activityMessage = `Seu agendamento de ${appointment.service?.name || 'serviço desconhecido'} para ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi confirmado.`;
                }
                break;
            case AppointmentStatus.CANCELLED:
                const now = new Date();
                const hoursUntilAppointment = differenceInHours(appointment.date, now);
                if (isAdmin || isProfOrCompanyAdmin) {
                    allowed = true;
                } else if (isOwner && (currentStatus === AppointmentStatus.PENDING || currentStatus === AppointmentStatus.CONFIRMED)) {
                    if (hoursUntilAppointment >= MIN_CANCELLATION_HOURS) {
                        allowed = true;
                    } else {
                        return res.status(400).json({ message: `Não é possível cancelar com menos de ${MIN_CANCELLATION_HOURS} horas de antecedência.` });
                    }
                }
                if (allowed) {
                    activityType = "APPOINTMENT_CANCELLED";
                    activityMessage = `Seu agendamento de ${appointment.service?.name || 'serviço desconhecido'} para ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi cancelado.`;
                }
                break;
            case AppointmentStatus.COMPLETED:
                if ((isAdmin || isProfOrCompanyAdmin) && currentStatus === AppointmentStatus.CONFIRMED) {
                    allowed = true;
                    activityType = "APPOINTMENT_COMPLETED";
                    activityMessage = `Seu agendamento de ${appointment.service?.name || 'serviço desconhecido'} em ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi concluído.`;
                    gamificationEvent = GamificationEventType.APPOINTMENT_COMPLETED;
                }
                break;
            case AppointmentStatus.PENDING:
                if (isAdmin && currentStatus === AppointmentStatus.CANCELLED) {
                    allowed = true;
                }
                break;
        }

        if (!allowed) {
            return res.status(403).json({ message: `Transição de status inválida de ${currentStatus} para ${newStatus} ou permissão insuficiente.` });
        }

        const updatedAppointment = await appointmentRepository.updateStatus(id, newStatus);
        try {
            if (activityType && activityMessage) {
                await logActivity(appointment.userId, activityType, activityMessage, {
                    id: id,
                    type: "Appointment"
                });
            }
            if (gamificationEvent) {
                await gamificationService.triggerEvent(appointment.userId, gamificationEvent, { relatedEntityId: id });
            }
        } catch (logError) {
            console.error("Error logging activity, sending notification, or triggering gamification:", logError);
        }
        return res.json(updatedAppointment);
    } catch (error) {
        console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
        next(error);
    }
};

// Obter horários disponíveis para um serviço/profissional em uma data específica
export const getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { date, serviceId, professionalId: queryProfessionalId, companyId } = req.query;
    let professionalId = queryProfessionalId as string | undefined;

    if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: "Parâmetro 'date' (YYYY-MM-DD) é obrigatório." });
    }
    if (!serviceId || typeof serviceId !== 'string' || !isValidUUID(serviceId)) {
        return res.status(400).json({ message: "Parâmetro 'serviceId' (UUID) é obrigatório." });
    }
    // If called via /api/professionals/:id/availability, use req.params.id as professionalId
    if (!professionalId && req.params && req.params.id && typeof req.params.id === 'string' && isValidUUID(req.params.id)) {
        professionalId = req.params.id;
    }
    // If neither professionalId nor companyId is provided, try to use authenticated user's professionalId
    if (!professionalId && !companyId) {
        if (req.user && req.user.id) {
            // Try to find professional profile for this user
            const prof = await professionalRepository.findByUserId(req.user.id);
            if (prof) {
                professionalId = prof.id;
            } else {
                return res.status(400).json({ message: "É necessário fornecer 'professionalId' ou 'companyId', ou o usuário autenticado não possui perfil profissional." });
            }
        } else {
            return res.status(400).json({ message: "É necessário fornecer 'professionalId' ou 'companyId'." });
        }
    }
    if (professionalId && (typeof professionalId !== 'string' || !isValidUUID(professionalId))) {
        return res.status(400).json({ message: "Formato de 'professionalId' inválido." });
    }
    if (companyId && (typeof companyId !== 'string' || !isValidUUID(companyId))) {
        return res.status(400).json({ message: "Formato de 'companyId' inválido." });
    }

    try {
        const targetDate = parse(date, 'yyyy-MM-dd', new Date());
        if (!isValid(targetDate)) {
            return res.status(400).json({ message: "Formato de data inválido. Use YYYY-MM-DD." });
        }

        const service = await serviceRepository.findById(serviceId);
        const duration = service ? parseDuration(service.duration) : null;
        if (!service || duration === null || duration <= 0) { // Check duration validity
            return res.status(404).json({ message: "Serviço não encontrado ou duração inválida." });
        }

        // Use a more specific type for professionalsToCheck based on includes
        type ProfessionalForAvailability = Prisma.ProfessionalGetPayload<{
            include: { company: true, services: true } // Include company and services
        }>
        let professionalsToCheck: ProfessionalForAvailability[] = [];

        if (professionalId) {
            // Use the corrected payload type
            const professional: ProfessionalWithDetails | null = await professionalRepository.findById(professionalId);
            if (!professional) {
                return res.status(404).json({ message: "Profissional não encontrado." });
            }
            // Check if this professional offers the service (using included services)
            const offersService = professional.services.some(ps => ps.serviceId === serviceId);
            if (!offersService) {
                 return res.status(400).json({ message: "O profissional especificado não oferece este serviço." });
            }
            // Cast to ProfessionalForAvailability if structure matches (might need adjustment)
            professionalsToCheck.push(professional as ProfessionalForAvailability);
        } else if (companyId) {
            // Find professionals in the company who offer the service
            // Adjust findMany to include necessary relations
            professionalsToCheck = await professionalRepository.findMany(
                { 
                    companyId: companyId, 
                    services: { some: { serviceId: serviceId } } 
                },
                {},
                0,
                1000 // Consider pagination limit
            ) as ProfessionalForAvailability[]; // Cast result
            
            if (professionalsToCheck.length === 0) {
                 return res.json({ availableSlots: [] }); // No professionals in this company offer this service
            }
        }

        // --- Availability Calculation --- 
        const allAvailableSlots: { [professionalId: string]: string[] } = {}; // Store slots per professional
        const intervalMinutes = 15; // Slot interval

        for (const prof of professionalsToCheck) {
            const profId = prof.id;
            allAvailableSlots[profId] = [];
            // Access company safely
            const workingHoursJson = prof.workingHours || prof.company?.workingHours || null;
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
                where: { // Added where clause
                    professionalId: profId,
                    startTime: { lt: dayEnd },
                    endTime: { gt: dayStart },
                }
            });

            // Pre-fetch service durations for appointments to optimize loop
            const appointmentServiceIds = existingAppointments.map(a => a.serviceId);
            const appointmentServices = await serviceRepository.findMany({ id: { in: appointmentServiceIds } }, {}, 0, 9999); // Provide default args
            const serviceDurationMap = new Map<string, number | null>();
            appointmentServices.forEach(s => serviceDurationMap.set(s.id, parseDuration(s.duration)));

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
                    const apptDuration = serviceDurationMap.get(appt.serviceId);
                    if (apptDuration === null || apptDuration === undefined || apptDuration <= 0) continue;
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
            return res.json({ availableSlots: allAvailableSlots[professionalId] || [] });
        } else {
            // For company, return slots grouped by professional or a combined list?
            // Returning grouped by professional ID for now
            return res.json({ availabilityByProfessional: allAvailableSlots });
        }

    } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
        next(error);
    }
};

// Add missing exports if they were removed or renamed
// Example: If getAppointmentAvailability was renamed to getAvailability
// export { getAvailability as getAppointmentAvailability };

// If cancelAppointment and deleteAppointment logic is needed, implement them
// export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { ... };
// export const deleteAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { ... };

