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

// Update AppointmentWithDetails type to include services
type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: {
    services: { include: { service: true } },
    professional: {
      include: {
        company: true
      }
    },
    company: true,
    user: { select: { id: true, name: true, email: true, avatar: true, phone: true } }
  }
}>;

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
    // Add debugging to track the incoming data
    const dateFormatted = format(date, 'yyyy-MM-dd');
    
    // Check if workingHoursJson is a valid object and not null/undefined
    if (!workingHoursJson) {
        console.log(`No working hours data provided for date ${dateFormatted}`);
        return null;
    }
    
    if (typeof workingHoursJson !== 'object' || Array.isArray(workingHoursJson)) {
        console.log(`Working hours is not a valid object for date ${dateFormatted}`);
        return null;
    }

    const dayOfWeek = getDay(date); // 0 (Sunday) to 6 (Saturday)
    const dayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayOfWeek];

    // Type assertion to treat workingHoursJson as an indexable object
    const hoursData = (workingHoursJson as { [key: string]: any })[dayKey];

    if (!hoursData) {
        console.log(`No hours data found for ${dayKey} (${dateFormatted})`);
        return null;
    }
    
    if (typeof hoursData !== 'object') {
        console.log(`Hours data for ${dayKey} is not an object (${dateFormatted})`);
        return null;
    }
    
    // isOpen can be undefined (assume open) or explicitly true
    if (hoursData.isOpen === false) {
        console.log(`${dayKey} is marked as closed (isOpen: false) for ${dateFormatted}`);
        return null;
    }
    
    if (!hoursData.start || !hoursData.end) {
        console.log(`Missing start or end time for ${dayKey} (${dateFormatted})`);
        return null;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(hoursData.start) || !timeRegex.test(hoursData.end)) {
        console.error(`Invalid time format in working hours for ${dayKey} (${dateFormatted}): start=${hoursData.start}, end=${hoursData.end}`);
        return null;
    }

    const [startHour, startMinute] = hoursData.start.split(':').map(Number);
    const [endHour, endMinute] = hoursData.end.split(':').map(Number);

    const startTime = setSeconds(setMinutes(setHours(date, startHour), startMinute), 0);
    const endTime = setSeconds(setMinutes(setHours(date, endHour), endMinute), 0);

    // Ensure end time is after start time
    if (endTime <= startTime) {
        console.warn(`Working hours end time is not after start time for ${dayKey} (${dateFormatted}). Adjusting end time to next day if necessary or ignoring.`);
        // Handle overnight logic if needed, or simply return null/invalid
        return null; // Or adjust endTime logic based on business rules
    }

    console.log(`Working hours for ${dayKey} (${dateFormatted}): ${format(startTime, 'HH:mm')} to ${format(endTime, 'HH:mm')}`);
    return { start: startTime, end: endTime };
};

// Helper function to check availability
export const checkAvailability = async (professionalId: string, start: Date, end: Date): Promise<boolean> => {
    const professional: ProfessionalWithDetails | null = await professionalRepository.findById(professionalId);
    if (!professional) throw new Error('Profissional não encontrado para verificação de disponibilidade.');

    // Determine working hours
    const workingHoursJson = professional.workingHours || professional.company?.workingHours || null;
    const workingHoursToday = getWorkingHoursForDay(workingHoursJson, start);

    if (!workingHoursToday) {
        console.log(`Availability Check: No working hours defined for ${professionalId} on ${format(start,'yyyy-MM-dd')}, skipping hours check.`);
    } else {
        // Check if the requested slot is within working hours
        if (!isWithinInterval(start, { start: workingHoursToday.start, end: workingHoursToday.end }) ||
            !isWithinInterval(addMinutes(end, -1), { start: workingHoursToday.start, end: workingHoursToday.end })) {
            console.log(`Availability Check: Slot outside working hours for ${professionalId}.`);
            return false;
        }
    }

    // 2. Check for Conflicting Appointments
    const conflictingAppointments = await appointmentRepository.findMany({
        professionalId: professionalId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
        // Check for appointments that overlap with the requested slot [start, end)
        // For overlap: we need appointments where either:
        // - The appointment starts before our end AND ends after our start, OR
        // - The appointment starts during our slot
        startTime: { lt: end },
        endTime: { gt: start }
    });

    // With the startTime and endTime fields, we can directly check for conflicts
    // without needing to calculate end times
    if (conflictingAppointments.length > 0) {
        const conflictingAppointment = conflictingAppointments[0];
        console.log(`Availability Check: Conflict with existing appointment ${conflictingAppointment.id} [${format(conflictingAppointment.startTime, 'HH:mm')}, ${format(conflictingAppointment.endTime, 'HH:mm')})`);
        return false;
    }

    // 3. Check for Schedule Blocks (disabled)
    // const conflictingBlocks = await scheduleBlockRepository.findMany({
    //     where: {
    //         professionalId: professionalId,
    //         startTime: { lt: end },
    //         endTime: { gt: start },
    //     }
    // });

    // if (conflictingBlocks.length > 0) {
    //     console.log(`Availability Check: Found conflicting schedule blocks for professional ${professionalId}`);
    //     return false;
    // }

    console.log(`Availability Check: Slot available for professional ${professionalId}`);
    return true; // Slot is available
};

// --- CONTROLLER METHODS ---

// Criar um novo agendamento
export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { serviceIds, professionalId, companyId, date, time, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    // --- Input Validation ---
    if (!Array.isArray(serviceIds) || serviceIds.length === 0 || !serviceIds.every(isValidUUID)) {
        return res.status(400).json({ message: 'IDs dos serviços inválidos.' });
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
        const services = await Promise.all(serviceIds.map((id: string) => serviceRepository.findById(id)));
        if (services.some(s => !s)) {
            return res.status(404).json({ message: 'Um ou mais serviços não encontrados.' });
        }
        const durations = services.map(s => s ? parseDuration(s.duration) : 0);
        if (durations.some(d => d === null || d <= 0)) {
            return res.status(404).json({ message: 'Duração inválida para um ou mais serviços.' });
        }
        // For now, sum durations for multi-service booking
        const totalDuration = durations.reduce((a, b) => (a || 0) + (b || 0), 0);

        if (!targetProfessionalId && companyId) {
            // TODO: Implement logic to select an available professional from the company for the service
            // This might involve checking which professionals offer the service and their availability
            // For now, require professionalId
            return res.status(400).json({ message: 'Seleção automática de profissional não implementada. Forneça professionalId.' });
            // Example: Find professionals in company offering the service
            // const professionals = await professionalRepository.findMany({ companyId, services: { some: { serviceId } } }, ...);
            // Then check availability for each...
        }

        // Ensure the selected professional exists and offers all services
        const professionalExists = await prisma.professional.findFirst({
            where: {
                id: targetProfessionalId,
                ...(companyId && { companyId: companyId }), // Optional: ensure professional is in the company if companyId is given
                services: { every: { serviceId: { in: serviceIds } } }
            }
        });

        if (!professionalExists) {
            return res.status(404).json({ message: 'Profissional não encontrado, não pertence à empresa ou não oferece todos os serviços selecionados.' });
        }

        // --- Availability Check ---
        const appointmentEnd = addMinutes(appointmentDate, totalDuration || 0);
        const isAvailable = await checkAvailability(targetProfessionalId, appointmentDate, appointmentEnd);

        if (!isAvailable) {
            return res.status(409).json({ message: 'Horário indisponível. Conflito com agendamento existente, bloqueio ou fora do horário de trabalho.' });
        }

        // --- Create Appointment ---
        const dataToCreate: Prisma.AppointmentCreateInput = {
            user: { connect: { id: userId } },
            professional: { connect: { id: targetProfessionalId } },
            startTime: appointmentDate,
            endTime: appointmentEnd,
            ...(companyId && { company: { connect: { id: companyId } } }),
            status: AppointmentStatus.PENDING, // Default status
            notes: notes || null,
            services: {
                create: serviceIds.map((id: string) => ({ service: { connect: { id } } }))
            }
        };

        const newAppointment = await appointmentRepository.create(dataToCreate);

        // --- ACTIVITY LOG & NOTIFICATION ---
        try {
            await logActivity(userId, "NEW_APPOINTMENT", `Você agendou ${services.filter(Boolean).map(s => s!.name).join(', ')} para ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`, {
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
    const { professionalId, companyId, userId: queryUserId, status, dateFrom, dateTo, serviceId, limit, sort, page = "1" } = req.query;

    if (!user) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
        let filters: Prisma.AppointmentWhereInput = {};
        const pageSize = limit ? parseInt(limit as string) : 100;
        const currentPage = parseInt(page as string) || 1;
        const skip = (currentPage - 1) * pageSize;
        let orderBy: any = { startTime: 'asc' };

        if (sort === 'startTime_desc') {
            orderBy = { startTime: 'desc' };
        }

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

        // Professional access control
        if (user.role === UserRole.PROFESSIONAL) {
            const professional = await professionalRepository.findByUserId(user.id);
            if (professional) {
                filters.professionalId = professional.id;
            }
        }

        // Filter by professionalId
        if (professionalId && typeof professionalId === 'string') {
             if (isValidUUID(professionalId)) {
                 filters.professionalId = professionalId;
             } else {
                 return res.status(400).json({ message: 'Formato de professionalId inválido.' });
             }
        }
        
        // Filter by status
        if (status && typeof status === 'string' && status in AppointmentStatus) {
            filters.status = status as AppointmentStatus;
        }
        
        // Filter by date range
        if (dateFrom && typeof dateFrom === 'string') {
            const parsedFromDate = parse(dateFrom as string, 'yyyy-MM-dd', new Date());
            if (isValid(parsedFromDate)) {
                filters.startTime = filters.startTime || {};
                Object.assign(filters.startTime, { 
                    gte: startOfDay(parsedFromDate),
                });
            } else {
                return res.status(400).json({ message: 'Formato de data inicial inválido. Use YYYY-MM-DD.' });
            }
        }
        
        if (dateTo && typeof dateTo === 'string') {
            const parsedToDate = parse(dateTo as string, 'yyyy-MM-dd', new Date());
            if (isValid(parsedToDate)) {
                filters.startTime = filters.startTime || {};
                Object.assign(filters.startTime, { 
                    lte: endOfDay(parsedToDate),
                });
            } else {
                return res.status(400).json({ message: 'Formato de data final inválido. Use YYYY-MM-DD.' });
            }
        }
        
        // Filter by serviceId (now as relation)
        if (serviceId && typeof serviceId === 'string') {
            if (isValidUUID(serviceId)) {
                filters.services = { some: { serviceId: serviceId } };
            } else {
                return res.status(400).json({ message: 'Formato de serviceId inválido.' });
            }
        }
        
        // Filter by companyId directly or through professionals
        if (companyId && typeof companyId === 'string') {
            if (!isValidUUID(companyId)) {
                 return res.status(400).json({ message: 'Formato de companyId inválido.' });
            }
            
            // Can now filter directly by companyId
            filters.companyId = companyId;
            
            // Or filter by professionals within that company for backward compatibility
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

        // Count total matching appointments for pagination
        const totalCount = await prisma.appointment.count({ where: filters });
        
        // Get paginated results with ordering
        const appointments = await prisma.appointment.findMany({
            where: filters,
            include: appointmentRepository.includeDetails,
            orderBy: orderBy,
            skip: skip,
            take: pageSize,
        });

        // Format response according to specification
        return res.json({
            data: appointments,
            meta: {
                total: totalCount,
                page: currentPage,
                limit: pageSize
            }
        });

    } catch (error) {
        console.error("Erro ao listar agendamentos:", error);
        next(error);
    }
};

// Obter detalhes de um agendamento específico
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { id } = req.params;
    const user = req.user;
    const { include } = req.query;

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

// Atualizar status de um agendamento (confirmar, cancelar, concluir, etc.)
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
        return res.status(400).json({ 
            error: {
                code: "VALIDATION_ERROR",
                message: "Status inválido fornecido",
                details: [
                    {
                        field: "status",
                        message: "Status deve ser um dos valores válidos: PENDING, CONFIRMED, CANCELLED, COMPLETED, IN_PROGRESS, NO_SHOW"
                    }
                ]
            }
        });
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

        let serviceNames = Array.isArray(appointment.services) && appointment.services.length > 0
            ? appointment.services.map((as: any) => as.service?.name).filter(Boolean).join(', ')
            : 'serviço desconhecido';

        switch (newStatus) {
            case AppointmentStatus.CONFIRMED:
                if ((isAdmin || isProfOrCompanyAdmin) && currentStatus === AppointmentStatus.PENDING) {
                    allowed = true;
                    activityType = "APPOINTMENT_CONFIRMED";
                    activityMessage = `Seu agendamento de ${serviceNames} para ${format(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} foi confirmado.`;
                }
                break;
            case AppointmentStatus.CANCELLED:
                const now = new Date();
                const hoursUntilAppointment = differenceInHours(appointment.startTime, now);
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
                    activityMessage = `Seu agendamento de ${serviceNames} para ${format(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} foi cancelado.`;
                }
                break;
            case AppointmentStatus.COMPLETED:
                if ((isAdmin || isProfOrCompanyAdmin) && 
                   (currentStatus === AppointmentStatus.CONFIRMED || currentStatus === AppointmentStatus.IN_PROGRESS)) {
                    allowed = true;
                    activityType = "APPOINTMENT_COMPLETED";
                    activityMessage = `Seu agendamento de ${serviceNames} em ${format(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} foi concluído.`;
                    gamificationEvent = GamificationEventType.APPOINTMENT_COMPLETED;
                }
                break;
            case AppointmentStatus.IN_PROGRESS:
                if ((isAdmin || isProfOrCompanyAdmin) && currentStatus === AppointmentStatus.CONFIRMED) {
                    allowed = true;
                    activityType = "APPOINTMENT_IN_PROGRESS";
                    activityMessage = `Seu agendamento de ${serviceNames} em ${format(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} está em andamento.`;
                }
                break;
            case AppointmentStatus.NO_SHOW:
                if ((isAdmin || isProfOrCompanyAdmin) && 
                   (currentStatus === AppointmentStatus.CONFIRMED || currentStatus === AppointmentStatus.PENDING)) {
                    allowed = true;
                    activityType = "APPOINTMENT_NO_SHOW";
                    activityMessage = `O cliente não compareceu ao agendamento de ${serviceNames} em ${format(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")}.`;
                }
                break;
            case AppointmentStatus.PENDING:
                if (isAdmin && currentStatus === AppointmentStatus.CANCELLED) {
                    allowed = true;
                    activityType = "APPOINTMENT_PENDING";
                    activityMessage = `Seu agendamento de ${serviceNames} para ${format(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} voltou para status pendente.`;
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
            
            // Access professional and company working hours
            const workingHoursJson = prof.workingHours || prof.company?.workingHours || null;
            const workingHoursToday = getWorkingHoursForDay(workingHoursJson, targetDate);
            if (!workingHoursToday) {
                continue; // Skip if not working
            }
            // Debug log working hours
            console.log(`Using working hours for professional ${profId}: ${format(workingHoursToday.start, 'HH:mm')} to ${format(workingHoursToday.end, 'HH:mm')}`);

            // Retrieve existing appointments and blocks
            const dayStart = startOfDay(targetDate);
            const dayEnd = endOfDay(targetDate);
            const existingAppointments = await appointmentRepository.findMany({
                professionalId: profId,
                status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
                startTime: { gte: dayStart, lt: dayEnd },
            });
            const scheduleBlocks = await scheduleBlockRepository.findMany({
                where: {
                    professionalId: profId,
                    startTime: { lt: dayEnd },
                    endTime: { gt: dayStart },
                }
            });

            // Iterate through potential slots
            let currentSlotStart = workingHoursToday.start;
            while (currentSlotStart < workingHoursToday.end) {
                const potentialSlotEnd = addMinutes(currentSlotStart, duration);
                if (potentialSlotEnd > workingHoursToday.end) break;

                let isSlotAvailable = true;
                // Check appointment conflicts
                for (const appt of existingAppointments) {
                    if (currentSlotStart < appt.endTime && potentialSlotEnd > appt.startTime) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (!isSlotAvailable) {
                    currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
                    continue;
                }
                // Check schedule block conflicts
                for (const block of scheduleBlocks) {
                    if (currentSlotStart < block.endTime && potentialSlotEnd > block.startTime) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (!isSlotAvailable) {
                    currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
                    continue;
                }
                // Add available slot
                allAvailableSlots[profId].push(format(currentSlotStart, 'HH:mm'));
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

// New controller for professional's full schedule and open hours
export const getProfessionalFullSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const professionalId = req.params.id;
    const { date } = req.query;
    if (!professionalId || !isValidUUID(professionalId)) {
      return res.status(400).json({ message: 'ID do profissional inválido.' });
    }
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: "Parâmetro 'date' (YYYY-MM-DD) é obrigatório." });
    }
    const targetDate = parse(date, 'yyyy-MM-dd', new Date());
    if (!isValid(targetDate)) {
      return res.status(400).json({ message: "Formato de data inválido. Use YYYY-MM-DD." });
    }
    // Get professional and working hours
    const professional = await professionalRepository.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }
    const workingHoursJson = professional.workingHours || professional.company?.workingHours || null;
    const workingHoursToday = getWorkingHoursForDay(workingHoursJson, targetDate);
    // Get all services for this professional
    const services = await serviceRepository.getServicesByProfessional(professionalId);
    // Get all appointments for this professional on the date
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    const appointments = await appointmentRepository.findMany({
      professionalId,
      startTime: { gte: dayStart, lt: dayEnd },
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED] },
    });
    // For each service, calculate all available slots and scheduled appointments
    const allServiceSchedules: any[] = [];
    for (const ps of services) {
      const service = ps.service;
      const duration = parseDuration(service.duration);
      if (!duration || !workingHoursToday) continue;
      const slots: string[] = [];
      let currentSlotStart = workingHoursToday.start;
      while (currentSlotStart < workingHoursToday.end) {
        const potentialSlotEnd = addMinutes(currentSlotStart, duration);
        if (potentialSlotEnd > workingHoursToday.end) break;
        slots.push(format(currentSlotStart, 'HH:mm'));
        currentSlotStart = addMinutes(currentSlotStart, 15);
      }
      // Get scheduled appointments for this service
      const scheduled = appointments
        .filter(a => Array.isArray(a.services) && a.services.some((as: any) => as.service && as.service.id === service.id))
        .map(a => ({
          id: a.id,
          startTime: format(a.startTime, 'HH:mm'),
          endTime: format(a.endTime, 'HH:mm'),
          status: a.status,
          userId: a.userId,
        }));
      allServiceSchedules.push({
        serviceId: service.id,
        serviceName: service.name,
        duration: service.duration,
        slots,
        scheduled,
      });
    }
    res.json({
      professionalId,
      date: format(targetDate, 'yyyy-MM-dd'),
      openHours: workingHoursToday ? {
        start: format(workingHoursToday.start, 'HH:mm'),
        end: format(workingHoursToday.end, 'HH:mm'),
      } : null,
      services: allServiceSchedules,
    });
  } catch (error) {
    next(error);
  }
};
// Add missing exports if they were removed or renamed
// Example: If getAppointmentAvailability was renamed to getAvailability
// export { getAvailability as getAppointmentAvailability };

// If cancelAppointment and deleteAppointment logic is needed, implement them
// export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { ... };
// export const deleteAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { ... };

