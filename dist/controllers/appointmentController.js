"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = exports.updateAppointmentStatus = exports.createAppointment = exports.getAppointmentById = exports.getAllAppointments = exports.checkAvailability = exports.getWorkingHoursForDay = exports.parseDuration = exports.MIN_CANCELLATION_HOURS = exports.MIN_BOOKING_ADVANCE_HOURS = void 0;
const appointmentRepository_1 = require("../repositories/appointmentRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
const professionalRepository_1 = require("../repositories/professionalRepository");
const scheduleBlockRepository_1 = require("../repositories/scheduleBlockRepository"); // Import repository for blocks
const prisma_1 = require("../lib/prisma"); // Import prisma client for direct access if needed
const client_1 = require("@prisma/client"); // Added UserRole
const date_fns_1 = require("date-fns"); // Added differenceInHours and isBefore
const gamificationService_1 = require("../services/gamificationService"); // Import gamification service
const activityLogService_1 = require("../services/activityLogService"); // Import activity log service
// Constants for Business Rules
exports.MIN_BOOKING_ADVANCE_HOURS = 1; // Minimum hours in advance to book
exports.MIN_CANCELLATION_HOURS = 2; // Minimum hours notice required to cancel
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Helper function to parse duration string (e.g., "60min", "1h", "1h30min") into minutes
const parseDuration = (duration) => {
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
exports.parseDuration = parseDuration;
const getWorkingHoursForDay = (workingHoursJson, date) => {
    if (!workingHoursJson || typeof workingHoursJson !== 'object')
        return null;
    const dayOfWeek = (0, date_fns_1.getDay)(date); // 0 for Sunday, 1 for Monday, etc.
    const hours = workingHoursJson[dayOfWeek];
    if (!hours || !hours.start || !hours.end)
        return null;
    try {
        const [startH, startM] = hours.start.split(':').map(Number);
        const [endH, endM] = hours.end.split(':').map(Number);
        const dayStart = (0, date_fns_1.startOfDay)(date);
        const workStart = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(dayStart, startH), startM), 0);
        const workEnd = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(dayStart, endH), endM), 0);
        // Handle cases where end time is on the next day (e.g., 22:00 - 02:00)
        if (workEnd <= workStart) {
            // Assuming end time is on the next day if it's earlier or same as start time
            // This logic might need adjustment based on exact business rules for overnight hours
            console.warn("Working hours might span across midnight, adjust logic if needed.");
            // For simplicity, let's assume end time is within the same day for now.
        }
        return { start: workStart, end: workEnd };
    }
    catch (e) {
        console.error("Error parsing working hours:", e);
        return null;
    }
};
exports.getWorkingHoursForDay = getWorkingHoursForDay;
// Helper function to check availability
const checkAvailability = (professionalId, start, end) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check Professional's Working Hours
    const professional = yield professionalRepository_1.professionalRepository.findById(professionalId);
    if (!professional)
        throw new Error('Profissional não encontrado para verificação de disponibilidade.');
    // Use professional's specific hours, fallback to company hours if needed (logic depends on requirements)
    const workingHoursJson = professional.workingHours || (professional.company ? professional.company.workingHours : null);
    const workingHoursToday = (0, exports.getWorkingHoursForDay)(workingHoursJson, start);
    if (!workingHoursToday) {
        console.log(`Availability Check: No working hours defined for professional ${professionalId} on ${(0, date_fns_1.format)(start, 'yyyy-MM-dd')}`);
        return false; // Not working on this day
    }
    // Check if requested slot is within working hours
    if (!(0, date_fns_1.isWithinInterval)(start, { start: workingHoursToday.start, end: workingHoursToday.end }) ||
        !(0, date_fns_1.isWithinInterval)(end, { start: workingHoursToday.start, end: workingHoursToday.end })) {
        console.log(`Availability Check: Requested slot ${(0, date_fns_1.format)(start, 'HH:mm')} - ${(0, date_fns_1.format)(end, 'HH:mm')} is outside working hours ${(0, date_fns_1.format)(workingHoursToday.start, 'HH:mm')} - ${(0, date_fns_1.format)(workingHoursToday.end, 'HH:mm')}`);
        return false;
    }
    // 2. Check for Conflicting Appointments
    const conflictingAppointments = yield appointmentRepository_1.appointmentRepository.findMany({
        professionalId: professionalId,
        status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED] }, // Check against pending and confirmed
        OR: [
            { date: { lt: end }, AND: { date: { gte: start } } }, // Starts during the slot
            // A more precise check requires knowing the end time of existing appointments:
            // date < requestedEnd && calculatedEndTime > requestedStart
            // Simplified check: Check if any appointment STARTS within the potential conflict window
            { date: { gt: start, lt: end } } // Existing appointment starts within the requested slot
        ],
    });
    if (conflictingAppointments.length > 0) {
        console.log(`Availability Check: Found ${conflictingAppointments.length} conflicting appointments for professional ${professionalId} between ${(0, date_fns_1.format)(start, 'HH:mm')} and ${(0, date_fns_1.format)(end, 'HH:mm')}`);
        return false;
    }
    // 3. Check for Schedule Blocks
    const conflictingBlocks = yield scheduleBlockRepository_1.scheduleBlockRepository.findMany({
        professionalId: professionalId,
        startTime: { lt: end },
        endTime: { gt: start },
    });
    if (conflictingBlocks.length > 0) {
        console.log(`Availability Check: Found ${conflictingBlocks.length} conflicting schedule blocks for professional ${professionalId} between ${(0, date_fns_1.format)(start, 'HH:mm')} and ${(0, date_fns_1.format)(end, 'HH:mm')}`);
        return false;
    }
    return true; // Available
});
exports.checkAvailability = checkAvailability;
// --- Controller Functions ---
// Obter todos os agendamentos (com filtros opcionais)
const getAllAppointments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { professionalId, companyId, status, date } = req.query;
    let userId = req.query.userId;
    const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    const authenticatedUserId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    // If not admin and no specific userId is requested, default to the authenticated user's appointments
    if (!userId && authenticatedUserId && userRole !== client_1.UserRole.ADMIN) {
        userId = authenticatedUserId;
    }
    if (userId && !isValidUUID(userId)) {
        res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
        return;
    }
    if (professionalId && !isValidUUID(professionalId)) {
        res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
        return;
    }
    if (status && !Object.values(client_1.AppointmentStatus).includes(status)) {
        res.status(400).json({
            message: 'Status inválido. Valores permitidos: ' + Object.values(client_1.AppointmentStatus).join(', ')
        });
        return;
    }
    let parsedDate;
    if (date && typeof date === 'string') {
        try {
            parsedDate = (0, date_fns_1.parse)(date, 'yyyy-MM-dd', new Date());
            if (!(0, date_fns_1.isValid)(parsedDate))
                throw new Error('Invalid date');
        }
        catch (e) {
            res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
            return;
        }
    }
    try {
        const filters = {};
        // Authorization: Non-admins can only see their own appointments unless filtering by professional/company?
        if (userId) {
            if (userRole !== client_1.UserRole.ADMIN && userId !== authenticatedUserId) {
                res.status(403).json({ message: 'Não autorizado a ver agendamentos de outro usuário.' });
                return;
            }
            filters.userId = userId;
        }
        else if (userRole !== client_1.UserRole.ADMIN && !professionalId && !companyId) {
            // If no filters and not admin, default to own appointments
            if (authenticatedUserId) {
                filters.userId = authenticatedUserId;
            }
            else {
                res.status(401).json({ message: 'Não autenticado.' });
                return;
            }
        }
        if (professionalId)
            filters.professionalId = professionalId;
        if (status)
            filters.status = status;
        if (parsedDate) {
            filters.date = {
                gte: (0, date_fns_1.startOfDay)(parsedDate),
                lt: (0, date_fns_1.endOfDay)(parsedDate),
            };
        }
        if (companyId && typeof companyId === 'string') {
            // Filter by professionals within that company
            const professionalsInCompany = yield professionalRepository_1.professionalRepository.findMany({ companyId: companyId }, undefined, { skip: 0, take: 1000 });
            const professionalIds = professionalsInCompany.map(p => p.id);
            if (professionalIds.length > 0) {
                if (filters.professionalId) {
                    // Ensure professional belongs to company if both are given
                    if (!professionalIds.includes(filters.professionalId)) {
                        res.json([]); // Professional not in the specified company
                        return;
                    }
                }
                else {
                    filters.professionalId = { in: professionalIds };
                }
            }
            else {
                res.json([]); // No professionals in the company
                return;
            }
        }
        // Ensure context for non-admins
        if (userRole !== client_1.UserRole.ADMIN && !filters.userId && !filters.professionalId && !companyId) {
            res.status(400).json({ message: 'Filtro insuficiente. Forneça userId, professionalId ou companyId.' });
            return;
        }
        const appointments = yield appointmentRepository_1.appointmentRepository.findMany(filters);
        res.json(appointments);
    }
    catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        next(error);
    }
});
exports.getAllAppointments = getAllAppointments;
// Obter um agendamento específico pelo ID
const getAppointmentById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const user = req.user; // Contains id and role
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id); // Use basic findById
        if (!appointment) {
            res.status(404).json({ message: 'Agendamento não encontrado' });
            return;
        }
        // Authorization check
        const isOwner = ((_a = appointment.user) === null || _a === void 0 ? void 0 : _a.id) === (user === null || user === void 0 ? void 0 : user.id);
        // Check if the logged-in user is the professional assigned to the appointment
        // This requires linking the Professional profile to a User account (e.g., via professional.userId)
        // Assuming professional.userId exists and matches req.user.id
        const isProfessionalAssigned = ((_b = appointment.professional) === null || _b === void 0 ? void 0 : _b.userId) === (user === null || user === void 0 ? void 0 : user.id);
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.ADMIN;
        if (!isOwner && !isProfessionalAssigned && !isAdmin) {
            res.status(403).json({ message: 'Não autorizado a ver este agendamento.' });
            return;
        }
        res.json(appointment);
    }
    catch (error) {
        console.error(`Erro ao buscar agendamento ${id}:`, error);
        next(error);
    }
});
exports.getAppointmentById = getAppointmentById;
// Criar um novo agendamento
const createAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { date, serviceId, professionalId, notes } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
    }
    if (!date || !serviceId) {
        res.status(400).json({ message: 'date e serviceId são obrigatórios.' });
        return;
    }
    let service; // Declare service outside try block
    try {
        const appointmentDate = (0, date_fns_1.parseISO)(date);
        if (!(0, date_fns_1.isValid)(appointmentDate) || (0, date_fns_1.isBefore)(appointmentDate, new Date())) {
            res.status(400).json({ message: 'Data inválida. Use o formato ISO 8601 e a data não pode ser no passado.' });
            return;
        }
        // --- Validação de Regras de Negócio (Antecedência Mínima) ---
        const now = new Date();
        const hoursDifference = (0, date_fns_1.differenceInHours)(appointmentDate, now);
        if (hoursDifference < exports.MIN_BOOKING_ADVANCE_HOURS) {
            res.status(400).json({ message: `É necessário agendar com pelo menos ${exports.MIN_BOOKING_ADVANCE_HOURS} hora(s) de antecedência.` });
            return;
        }
        // --- Validação Pré-Criação (Disponibilidade) ---
        service = yield serviceRepository_1.serviceRepository.findById(serviceId); // Assign service here
        const duration = service ? (0, exports.parseDuration)(service.duration) : null;
        if (!service || duration === null) {
            res.status(404).json({ message: 'Serviço não encontrado ou duração inválida.' });
            return;
        }
        const appointmentEnd = (0, date_fns_1.addMinutes)(appointmentDate, duration);
        // Fetch professional (required for availability check)
        let targetProfessionalId = professionalId;
        if (!targetProfessionalId) {
            // If professionalId is not provided, find one who offers the service
            const profServices = yield prisma_1.prisma.professionalService.findMany({ where: { serviceId: serviceId }, include: { professional: true } });
            if (profServices.length === 1) {
                targetProfessionalId = profServices[0].professionalId;
            }
            else if (profServices.length > 1) {
                res.status(400).json({ message: 'professionalId é obrigatório para este serviço, pois múltiplos profissionais o oferecem.' });
                return;
            }
            else {
                res.status(404).json({ message: 'Nenhum profissional encontrado que ofereça este serviço.' });
                return;
            }
        }
        else {
            // If professionalId IS provided, validate it
            if (!isValidUUID(targetProfessionalId)) {
                res.status(400).json({ message: 'Formato de professionalId inválido.' });
                return;
            }
            // Validate that the specified professional actually offers the service
            const profServiceLink = yield prisma_1.prisma.professionalService.findUnique({
                where: { professionalId_serviceId: { professionalId: targetProfessionalId, serviceId: serviceId } }
            });
            if (!profServiceLink) {
                res.status(400).json({ message: 'O profissional especificado não oferece este serviço.' });
                return;
            }
        }
        const isAvailable = yield (0, exports.checkAvailability)(targetProfessionalId, appointmentDate, appointmentEnd);
        if (!isAvailable) {
            res.status(409).json({ message: 'Horário indisponível.' }); // 409 Conflict
            return;
        }
        // --- Fim Validação Pré-Criação ---
        const dataToCreate = {
            date: appointmentDate,
            user: { connect: { id: userId } },
            service: { connect: { id: serviceId } },
            status: client_1.AppointmentStatus.PENDING, // Default status
            notes: notes,
            professional: { connect: { id: targetProfessionalId } } // Connect determined professional
        };
        const newAppointment = yield appointmentRepository_1.appointmentRepository.create(dataToCreate);
        // --- ACTIVITY LOG & NOTIFICATION ---
        try {
            yield (0, activityLogService_1.logActivity)(userId, "NEW_APPOINTMENT", {
                message: `Você agendou ${service.name} para ${(0, date_fns_1.format)(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`,
                relatedEntityId: newAppointment.id,
                relatedEntityType: "Appointment"
            });
            // Notify professional/company? (Example)
            // await createNotification(targetProfessionalId, "NEW_APPOINTMENT_REQUEST", {
            //     message: `Novo agendamento de ${req.user?.name} para ${service.name} em ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`,
            //     relatedEntityId: newAppointment.id
            // });
        }
        catch (logError) {
            console.error("Error logging activity or sending notification:", logError);
            // Don't fail the request, just log the error
        }
        // --- END ACTIVITY LOG & NOTIFICATION ---
        res.status(201).json(newAppointment);
    }
    catch (error) {
        console.error('Erro ao criar agendamento:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // Handle cases where service or professional might not be found during connect
            res.status(404).json({ message: `Erro ao criar agendamento: ${((_b = error.meta) === null || _b === void 0 ? void 0 : _b.cause) || 'Serviço ou Profissional não encontrado.'}` });
        }
        else {
            next(error);
        }
    }
});
exports.createAppointment = createAppointment;
// Atualizar status de um agendamento (Confirmar, Cancelar, Completar)
const updateAppointmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    if (!status || !Object.values(client_1.AppointmentStatus).includes(status)) {
        res.status(400).json({
            message: 'Status inválido. Valores permitidos: ' + Object.values(client_1.AppointmentStatus).join(', ')
        });
        return;
    }
    try {
        const appointment = yield appointmentRepository_1.appointmentRepository.findByIdWithService(id); // Include service for logging
        if (!appointment) {
            res.status(404).json({ message: 'Agendamento não encontrado' });
            return;
        }
        const currentStatus = appointment.status;
        const newStatus = status;
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.ADMIN;
        const isOwner = appointment.userId === (user === null || user === void 0 ? void 0 : user.id);
        // TODO: Add check if user is the professional or company owner
        // --- Authorization & Status Transition Logic ---
        let allowed = false;
        let activityType = null;
        let activityMessage = null;
        let gamificationEvent = null;
        switch (newStatus) {
            case client_1.AppointmentStatus.CONFIRMED:
                if (isAdmin && currentStatus === client_1.AppointmentStatus.PENDING) {
                    allowed = true;
                    activityType = "APPOINTMENT_CONFIRMED";
                    activityMessage = `Seu agendamento de ${appointment.service.name} para ${(0, date_fns_1.format)(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi confirmado.`;
                }
                break;
            case client_1.AppointmentStatus.CANCELLED:
                const now = new Date();
                const hoursUntilAppointment = (0, date_fns_1.differenceInHours)(appointment.date, now);
                if (isAdmin) {
                    allowed = true; // Admin can always cancel
                }
                else if (isOwner && (currentStatus === client_1.AppointmentStatus.PENDING || currentStatus === client_1.AppointmentStatus.CONFIRMED)) {
                    if (hoursUntilAppointment >= exports.MIN_CANCELLATION_HOURS) {
                        allowed = true;
                    }
                    else {
                        res.status(400).json({ message: `Não é possível cancelar com menos de ${exports.MIN_CANCELLATION_HOURS} horas de antecedência.` });
                        return;
                    }
                }
                if (allowed) {
                    activityType = "APPOINTMENT_CANCELLED";
                    activityMessage = `Seu agendamento de ${appointment.service.name} para ${(0, date_fns_1.format)(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi cancelado.`;
                }
                break;
            case client_1.AppointmentStatus.COMPLETED:
                // Only Admin or Professional can mark as completed?
                if (isAdmin && currentStatus === client_1.AppointmentStatus.CONFIRMED) {
                    allowed = true;
                    activityType = "APPOINTMENT_COMPLETED";
                    activityMessage = `Seu agendamento de ${appointment.service.name} em ${(0, date_fns_1.format)(appointment.date, "dd/MM/yyyy 'às' HH:mm")} foi concluído.`;
                    gamificationEvent = gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED;
                }
                break;
            case client_1.AppointmentStatus.NO_SHOW:
                // Only Admin or Professional?
                if (isAdmin && currentStatus === client_1.AppointmentStatus.CONFIRMED) {
                    allowed = true;
                    activityType = "APPOINTMENT_NO_SHOW";
                    activityMessage = `Você não compareceu ao agendamento de ${appointment.service.name} em ${(0, date_fns_1.format)(appointment.date, "dd/MM/yyyy 'às' HH:mm")}.`;
                    // Consider gamification penalty?
                }
                break;
            case client_1.AppointmentStatus.PENDING:
                // Generally shouldn't transition back to PENDING, maybe admin override?
                if (isAdmin && currentStatus === client_1.AppointmentStatus.CANCELLED) { // Example: Admin reopens a cancelled appointment
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
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.update(id, { status: newStatus });
        // --- ACTIVITY LOG, NOTIFICATION & GAMIFICATION ---
        try {
            if (activityType && activityMessage) {
                yield (0, activityLogService_1.logActivity)(appointment.userId, activityType, {
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
                yield gamificationService_1.gamificationService.triggerEvent(appointment.userId, gamificationEvent, { relatedEntityId: id });
            }
        }
        catch (logError) {
            console.error("Error logging activity, sending notification, or triggering gamification:", logError);
            // Don't fail the request
        }
        // --- END ACTIVITY LOG, NOTIFICATION & GAMIFICATION ---
        res.json(updatedAppointment);
    }
    catch (error) {
        console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
        next(error);
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Obter horários disponíveis para um serviço/profissional em uma data específica
const getAvailability = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const targetDate = (0, date_fns_1.parse)(date, 'yyyy-MM-dd', new Date());
        if (!(0, date_fns_1.isValid)(targetDate)) {
            res.status(400).json({ message: "Formato de data inválido. Use YYYY-MM-DD." });
            return;
        }
        const service = yield serviceRepository_1.serviceRepository.findById(serviceId);
        const duration = service ? (0, exports.parseDuration)(service.duration) : null;
        if (!service || duration === null) {
            res.status(404).json({ message: "Serviço não encontrado ou duração inválida." });
            return;
        }
        let professionalsToCheck = [];
        if (professionalId) {
            const professional = yield professionalRepository_1.professionalRepository.findById(professionalId);
            if (!professional) {
                res.status(404).json({ message: "Profissional não encontrado." });
                return;
            }
            // Check if this professional offers the service
            const profServiceLink = yield prisma_1.prisma.professionalService.findUnique({
                where: { professionalId_serviceId: { professionalId: professionalId, serviceId: serviceId } }
            });
            if (!profServiceLink) {
                res.status(400).json({ message: "O profissional especificado não oferece este serviço." });
                return;
            }
            professionalsToCheck.push(professional);
        }
        else if (companyId) {
            // Find professionals in the company who offer the service
            const profServices = yield prisma_1.prisma.professionalService.findMany({
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
        const allAvailableSlots = {}; // Store slots per professional
        const intervalMinutes = 15; // Slot interval
        for (const prof of professionalsToCheck) {
            const profId = prof.id;
            allAvailableSlots[profId] = [];
            const workingHoursJson = prof.workingHours || (prof.company ? prof.company.workingHours : null);
            const workingHoursToday = (0, exports.getWorkingHoursForDay)(workingHoursJson, targetDate);
            if (!workingHoursToday)
                continue; // Skip if not working
            // Get existing appointments and blocks for this professional on this day
            const dayStart = (0, date_fns_1.startOfDay)(targetDate);
            const dayEnd = (0, date_fns_1.endOfDay)(targetDate);
            const existingAppointments = yield appointmentRepository_1.appointmentRepository.findMany({
                professionalId: profId,
                status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED] },
                date: { gte: dayStart, lt: dayEnd },
            });
            const scheduleBlocks = yield scheduleBlockRepository_1.scheduleBlockRepository.findMany({
                professionalId: profId,
                startTime: { lt: dayEnd },
                endTime: { gt: dayStart },
            });
            // Iterate through potential slots
            let currentSlotStart = workingHoursToday.start;
            while (currentSlotStart < workingHoursToday.end) {
                const potentialSlotEnd = (0, date_fns_1.addMinutes)(currentSlotStart, duration);
                // Check if slot END is within working hours
                if (potentialSlotEnd > workingHoursToday.end) {
                    break; // No more possible slots
                }
                let isSlotAvailable = true;
                // Check against existing appointments
                for (const appt of existingAppointments) {
                    const apptDuration = (yield serviceRepository_1.serviceRepository.findById(appt.serviceId).then(s => s ? (0, exports.parseDuration)(s.duration) : 0)) || 0;
                    const apptEnd = (0, date_fns_1.addMinutes)(appt.date, apptDuration);
                    // Check for overlap: (SlotStart < ApptEnd) and (SlotEnd > ApptStart)
                    if (currentSlotStart < apptEnd && potentialSlotEnd > appt.date) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (!isSlotAvailable) {
                    currentSlotStart = (0, date_fns_1.addMinutes)(currentSlotStart, intervalMinutes);
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
                    currentSlotStart = (0, date_fns_1.addMinutes)(currentSlotStart, intervalMinutes);
                    continue;
                }
                // If available, add to list
                allAvailableSlots[profId].push((0, date_fns_1.format)(currentSlotStart, 'HH:mm'));
                // Move to the next potential slot
                currentSlotStart = (0, date_fns_1.addMinutes)(currentSlotStart, intervalMinutes);
            }
        }
        // Format response based on input (single professional or company)
        if (professionalId) {
            res.json({ availableSlots: allAvailableSlots[professionalId] || [] });
        }
        else {
            // For company, return slots grouped by professional or a combined list?
            // Returning grouped by professional ID for now
            res.json({ availabilityByProfessional: allAvailableSlots });
        }
    }
    catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
        next(error);
    }
});
exports.getAvailability = getAvailability;
