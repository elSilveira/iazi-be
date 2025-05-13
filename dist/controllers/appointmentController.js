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
exports.getAvailability = exports.updateAppointmentStatus = exports.getAppointmentById = exports.listAppointments = exports.createAppointment = exports.checkAvailability = exports.getWorkingHoursForDay = exports.parseDuration = exports.MIN_CANCELLATION_HOURS = exports.MIN_BOOKING_ADVANCE_HOURS = void 0;
const appointmentRepository_1 = require("../repositories/appointmentRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
const professionalRepository_1 = require("../repositories/professionalRepository");
const scheduleBlockRepository_1 = require("../repositories/scheduleBlockRepository"); // Import repository for blocks
const prisma_1 = require("../lib/prisma"); // Import prisma client for direct access if needed
const client_1 = require("@prisma/client"); // Removed Address, added CompanyAddress
const date_fns_1 = require("date-fns"); // Added differenceInHours and isBefore
const gamificationService_1 = require("../services/gamificationService"); // Import gamification service
const activityLogService_1 = require("../services/activityLogService"); // Import activity log service
// Constants for Business Rules
exports.MIN_BOOKING_ADVANCE_HOURS = 1; // Minimum hours in advance to book
exports.MIN_CANCELLATION_HOURS = 2; // Minimum hours notice required to cancel
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
// Helper function to parse duration string (e.g., "PT1H30M") to minutes
const parseDuration = (durationString) => {
    if (!durationString)
        return null;
    // Updated regex to handle ISO 8601 duration format (PTnHnM)
    const match = durationString.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
    if (!match) {
        // Fallback for simple formats like "30m", "1h", "1h30m" (less robust)
        let totalMinutes = 0;
        const hourMatch = durationString.match(/(\d+)h/);
        const minMatch = durationString.match(/(\d+)m/);
        if (hourMatch)
            totalMinutes += parseInt(hourMatch[1], 10) * 60;
        if (minMatch)
            totalMinutes += parseInt(minMatch[1], 10);
        return totalMinutes > 0 ? totalMinutes : null;
    }
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
};
exports.parseDuration = parseDuration;
// Helper function to get working hours for a specific day
const getWorkingHoursForDay = (workingHoursJson, date) => {
    // Add debugging to track the incoming data
    const dateFormatted = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
    // Check if workingHoursJson is a valid object and not null/undefined
    if (!workingHoursJson) {
        console.log(`No working hours data provided for date ${dateFormatted}`);
        return null;
    }
    if (typeof workingHoursJson !== 'object' || Array.isArray(workingHoursJson)) {
        console.log(`Working hours is not a valid object for date ${dateFormatted}`);
        return null;
    }
    const dayOfWeek = (0, date_fns_1.getDay)(date); // 0 (Sunday) to 6 (Saturday)
    const dayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayOfWeek];
    // Type assertion to treat workingHoursJson as an indexable object
    const hoursData = workingHoursJson[dayKey];
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
    const startTime = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(date, startHour), startMinute), 0);
    const endTime = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(date, endHour), endMinute), 0);
    // Ensure end time is after start time
    if (endTime <= startTime) {
        console.warn(`Working hours end time is not after start time for ${dayKey} (${dateFormatted}). Adjusting end time to next day if necessary or ignoring.`);
        // Handle overnight logic if needed, or simply return null/invalid
        return null; // Or adjust endTime logic based on business rules
    }
    console.log(`Working hours for ${dayKey} (${dateFormatted}): ${(0, date_fns_1.format)(startTime, 'HH:mm')} to ${(0, date_fns_1.format)(endTime, 'HH:mm')}`);
    return { start: startTime, end: endTime };
};
exports.getWorkingHoursForDay = getWorkingHoursForDay;
// Helper function to check availability
const checkAvailability = (professionalId, start, end) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const professional = yield professionalRepository_1.professionalRepository.findById(professionalId);
    if (!professional)
        throw new Error('Profissional não encontrado para verificação de disponibilidade.');
    // Determine working hours
    const workingHoursJson = professional.workingHours || ((_a = professional.company) === null || _a === void 0 ? void 0 : _a.workingHours) || null;
    const workingHoursToday = (0, exports.getWorkingHoursForDay)(workingHoursJson, start);
    if (!workingHoursToday) {
        console.log(`Availability Check: No working hours defined for ${professionalId} on ${(0, date_fns_1.format)(start, 'yyyy-MM-dd')}, skipping hours check.`);
    }
    else {
        // Check if the requested slot is within working hours
        if (!(0, date_fns_1.isWithinInterval)(start, { start: workingHoursToday.start, end: workingHoursToday.end }) ||
            !(0, date_fns_1.isWithinInterval)((0, date_fns_1.addMinutes)(end, -1), { start: workingHoursToday.start, end: workingHoursToday.end })) {
            console.log(`Availability Check: Slot outside working hours for ${professionalId}.`);
            return false;
        }
    }
    // 2. Check for Conflicting Appointments
    const conflictingAppointments = yield appointmentRepository_1.appointmentRepository.findMany({
        professionalId: professionalId,
        status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED, client_1.AppointmentStatus.IN_PROGRESS] },
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
        console.log(`Availability Check: Conflict with existing appointment ${conflictingAppointment.id} [${(0, date_fns_1.format)(conflictingAppointment.startTime, 'HH:mm')}, ${(0, date_fns_1.format)(conflictingAppointment.endTime, 'HH:mm')})`);
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
});
exports.checkAvailability = checkAvailability;
// --- CONTROLLER METHODS ---
// Criar um novo agendamento
const createAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { serviceId, professionalId, companyId, date, time, notes } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        const appointmentDate = (0, date_fns_1.parseISO)(appointmentDateTimeString); // Use parseISO for better timezone handling if the string is ISO 8601
        if (!(0, date_fns_1.isValid)(appointmentDate)) {
            return res.status(400).json({ message: 'Formato de data/hora inválido. Use YYYY-MM-DD e HH:MM.' });
        }
        // Check if booking is in the past
        if ((0, date_fns_1.isBefore)(appointmentDate, (0, date_fns_1.addMinutes)(new Date(), -5))) { // Allow 5 min buffer
            return res.status(400).json({ message: 'Não é possível agendar no passado.' });
        }
        // Check if booking too far in advance (e.g., > 90 days)
        // if (differenceInDays(appointmentDate, new Date()) > 90) { ... }
        // Check minimum booking advance time
        if ((0, date_fns_1.differenceInHours)(appointmentDate, new Date()) < exports.MIN_BOOKING_ADVANCE_HOURS) {
            return res.status(400).json({ message: `O agendamento deve ser feito com pelo menos ${exports.MIN_BOOKING_ADVANCE_HOURS} hora(s) de antecedência.` });
        }
        // --- Entity Validation & Selection ---
        const service = yield serviceRepository_1.serviceRepository.findById(serviceId);
        const durationMinutes = service ? (0, exports.parseDuration)(service.duration) : null;
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
        const professionalExists = yield prisma_1.prisma.professional.findFirst({
            where: Object.assign(Object.assign({ id: targetProfessionalId }, (companyId && { companyId: companyId })), { services: { some: { serviceId: serviceId } } })
        });
        if (!professionalExists) {
            return res.status(404).json({ message: 'Profissional não encontrado, não pertence à empresa ou não oferece o serviço selecionado.' });
        }
        // --- Availability Check ---
        const appointmentEnd = (0, date_fns_1.addMinutes)(appointmentDate, durationMinutes);
        const isAvailable = yield (0, exports.checkAvailability)(targetProfessionalId, appointmentDate, appointmentEnd);
        if (!isAvailable) {
            return res.status(409).json({ message: 'Horário indisponível. Conflito com agendamento existente, bloqueio ou fora do horário de trabalho.' });
        }
        // --- Create Appointment ---
        const dataToCreate = Object.assign(Object.assign({ user: { connect: { id: userId } }, service: { connect: { id: serviceId } }, professional: { connect: { id: targetProfessionalId } }, startTime: appointmentDate, endTime: appointmentEnd }, (companyId && { company: { connect: { id: companyId } } })), { status: client_1.AppointmentStatus.PENDING, notes: notes || null });
        const newAppointment = yield appointmentRepository_1.appointmentRepository.create(dataToCreate);
        // --- ACTIVITY LOG & NOTIFICATION ---
        try {
            yield (0, activityLogService_1.logActivity)(userId, "NEW_APPOINTMENT", `Você agendou ${service.name} para ${(0, date_fns_1.format)(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`, {
                id: newAppointment.id,
                type: "Appointment"
            });
            // Notify professional/company? (Example)
            // await createNotification(targetProfessionalId, "NEW_APPOINTMENT_REQUEST", {
            //     message: `Novo agendamento de ${req.user?.name} para ${service.name} em ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`,
            //     relatedEntityId: newAppointment.id
            // });
        }
        catch (logError) {
            console.error("Error logging activity or sending notification:", logError);
            // Don't fail the request because of logging/notification error
        }
        // --- GAMIFICATION --- 
        try {
            yield gamificationService_1.gamificationService.triggerEvent(userId, gamificationService_1.GamificationEventType.APPOINTMENT_BOOKED, { relatedEntityId: newAppointment.id });
        }
        catch (gamificationError) {
            console.error("Error triggering gamification event:", gamificationError);
        }
        return res.status(201).json(newAppointment);
    }
    catch (error) {
        console.error("Erro ao criar agendamento:", error);
        next(error); // Pass error to global error handler
    }
});
exports.createAppointment = createAppointment;
// Listar agendamentos (com filtros)
const listAppointments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { professionalId, companyId, userId: queryUserId, status, dateFrom, dateTo, serviceId, limit, sort, page = "1" } = req.query;
    if (!user) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    try {
        let filters = {};
        const pageSize = limit ? parseInt(limit) : 100;
        const currentPage = parseInt(page) || 1;
        const skip = (currentPage - 1) * pageSize;
        let orderBy = { startTime: 'asc' };
        if (sort === 'startTime_desc') {
            orderBy = { startTime: 'desc' };
        }
        // Security: Non-admins can only see their own appointments unless querying by professional/company
        if (user.role !== client_1.UserRole.ADMIN && !professionalId && !companyId) {
            filters.userId = user.id;
        }
        else if (user.role === client_1.UserRole.ADMIN && queryUserId && typeof queryUserId === 'string') {
            if (isValidUUID(queryUserId)) {
                filters.userId = queryUserId; // Admin can filter by userId
            }
            else {
                return res.status(400).json({ message: 'Formato de userId inválido.' });
            }
        }
        // Professional access control
        if (user.role === client_1.UserRole.PROFESSIONAL) {
            const professional = yield professionalRepository_1.professionalRepository.findByUserId(user.id);
            if (professional) {
                filters.professionalId = professional.id;
            }
        }
        // Filter by professionalId
        if (professionalId && typeof professionalId === 'string') {
            if (isValidUUID(professionalId)) {
                filters.professionalId = professionalId;
            }
            else {
                return res.status(400).json({ message: 'Formato de professionalId inválido.' });
            }
        }
        // Filter by status
        if (status && typeof status === 'string' && status in client_1.AppointmentStatus) {
            filters.status = status;
        }
        // Filter by date range
        if (dateFrom && typeof dateFrom === 'string') {
            const parsedFromDate = (0, date_fns_1.parse)(dateFrom, 'yyyy-MM-dd', new Date());
            if ((0, date_fns_1.isValid)(parsedFromDate)) {
                filters.startTime = filters.startTime || {};
                Object.assign(filters.startTime, {
                    gte: (0, date_fns_1.startOfDay)(parsedFromDate),
                });
            }
            else {
                return res.status(400).json({ message: 'Formato de data inicial inválido. Use YYYY-MM-DD.' });
            }
        }
        if (dateTo && typeof dateTo === 'string') {
            const parsedToDate = (0, date_fns_1.parse)(dateTo, 'yyyy-MM-dd', new Date());
            if ((0, date_fns_1.isValid)(parsedToDate)) {
                filters.startTime = filters.startTime || {};
                Object.assign(filters.startTime, {
                    lte: (0, date_fns_1.endOfDay)(parsedToDate),
                });
            }
            else {
                return res.status(400).json({ message: 'Formato de data final inválido. Use YYYY-MM-DD.' });
            }
        }
        // Filter by serviceId
        if (serviceId && typeof serviceId === 'string') {
            if (isValidUUID(serviceId)) {
                filters.serviceId = serviceId;
            }
            else {
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
            const professionalsInCompany = yield professionalRepository_1.professionalRepository.findMany({ companyId: companyId }, {}, 0, 1000);
            const professionalIds = professionalsInCompany.map(p => p.id);
            if (professionalIds.length > 0) {
                // If professionalId filter already exists, ensure it's one of the company's professionals
                if (filters.professionalId && typeof filters.professionalId === 'string') {
                    if (!professionalIds.includes(filters.professionalId)) {
                        // Professional not in company, return empty list
                        return res.json([]);
                    }
                }
                else {
                    // Otherwise, filter by all professionals in the company
                    filters.professionalId = { in: professionalIds };
                }
            }
            else {
                // No professionals in company, return empty list
                return res.json([]);
            }
        }
        // Count total matching appointments for pagination
        const totalCount = yield prisma_1.prisma.appointment.count({ where: filters });
        // Get paginated results with ordering
        const appointments = yield prisma_1.prisma.appointment.findMany({
            where: filters,
            include: appointmentRepository_1.appointmentRepository.includeDetails,
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
    }
    catch (error) {
        console.error("Erro ao listar agendamentos:", error);
        next(error);
    }
});
exports.listAppointments = listAppointments;
// Obter detalhes de um agendamento específico
const getAppointmentById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }
        // Authorization check
        const isOwner = appointment.userId === (user === null || user === void 0 ? void 0 : user.id);
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
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.ADMIN;
        if (!isOwner && !isAdmin) { // Simplified: Only owner or admin can view
            return res.status(403).json({ message: 'Não autorizado a ver este agendamento.' });
        }
        return res.json(appointment);
    }
    catch (error) {
        console.error(`Erro ao buscar agendamento ${id}:`, error);
        next(error);
    }
});
exports.getAppointmentById = getAppointmentById;
// Utility: Check if user is the professional or (future: company admin/owner)
function isProfessionalOrCompanyAdmin(user, appointment) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!user || !appointment)
            return false;
        // Check if user is the professional (by userId on Professional)
        if (appointment.professional && appointment.professional.userId && appointment.professional.userId === user.id) {
            return true;
        }
        // Future: Add company admin/owner logic here if schema supports it
        return false;
    });
}
// Atualizar status de um agendamento (confirmar, cancelar, concluir, etc.)
const updateAppointmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    if (!isValidUUID(id)) {
        return res.status(400).json({ message: 'ID de agendamento inválido.' });
    }
    if (!status || !(status in client_1.AppointmentStatus)) {
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
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }
        const currentStatus = appointment.status;
        const newStatus = status;
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.ADMIN;
        const isOwner = appointment.userId === (user === null || user === void 0 ? void 0 : user.id);
        // Implement real check for professional or company admin
        const isProfOrCompanyAdmin = yield isProfessionalOrCompanyAdmin(user, appointment);
        let allowed = false;
        let activityType = null;
        let activityMessage = null;
        let gamificationEvent = null;
        switch (newStatus) {
            case client_1.AppointmentStatus.CONFIRMED:
                if ((isAdmin || isProfOrCompanyAdmin) && currentStatus === client_1.AppointmentStatus.PENDING) {
                    allowed = true;
                    activityType = "APPOINTMENT_CONFIRMED";
                    activityMessage = `Seu agendamento de ${((_a = appointment.service) === null || _a === void 0 ? void 0 : _a.name) || 'serviço desconhecido'} para ${(0, date_fns_1.format)(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} foi confirmado.`;
                }
                break;
            case client_1.AppointmentStatus.CANCELLED:
                const now = new Date();
                const hoursUntilAppointment = (0, date_fns_1.differenceInHours)(appointment.startTime, now);
                if (isAdmin || isProfOrCompanyAdmin) {
                    allowed = true;
                }
                else if (isOwner && (currentStatus === client_1.AppointmentStatus.PENDING || currentStatus === client_1.AppointmentStatus.CONFIRMED)) {
                    if (hoursUntilAppointment >= exports.MIN_CANCELLATION_HOURS) {
                        allowed = true;
                    }
                    else {
                        return res.status(400).json({ message: `Não é possível cancelar com menos de ${exports.MIN_CANCELLATION_HOURS} horas de antecedência.` });
                    }
                }
                if (allowed) {
                    activityType = "APPOINTMENT_CANCELLED";
                    activityMessage = `Seu agendamento de ${((_b = appointment.service) === null || _b === void 0 ? void 0 : _b.name) || 'serviço desconhecido'} para ${(0, date_fns_1.format)(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} foi cancelado.`;
                }
                break;
            case client_1.AppointmentStatus.COMPLETED:
                if ((isAdmin || isProfOrCompanyAdmin) &&
                    (currentStatus === client_1.AppointmentStatus.CONFIRMED || currentStatus === client_1.AppointmentStatus.IN_PROGRESS)) {
                    allowed = true;
                    activityType = "APPOINTMENT_COMPLETED";
                    activityMessage = `Seu agendamento de ${((_c = appointment.service) === null || _c === void 0 ? void 0 : _c.name) || 'serviço desconhecido'} em ${(0, date_fns_1.format)(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} foi concluído.`;
                    gamificationEvent = gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED;
                }
                break;
            case client_1.AppointmentStatus.IN_PROGRESS:
                if ((isAdmin || isProfOrCompanyAdmin) && currentStatus === client_1.AppointmentStatus.CONFIRMED) {
                    allowed = true;
                    activityType = "APPOINTMENT_IN_PROGRESS";
                    activityMessage = `Seu agendamento de ${((_d = appointment.service) === null || _d === void 0 ? void 0 : _d.name) || 'serviço desconhecido'} em ${(0, date_fns_1.format)(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} está em andamento.`;
                }
                break;
            case client_1.AppointmentStatus.NO_SHOW:
                if ((isAdmin || isProfOrCompanyAdmin) &&
                    (currentStatus === client_1.AppointmentStatus.CONFIRMED || currentStatus === client_1.AppointmentStatus.PENDING)) {
                    allowed = true;
                    activityType = "APPOINTMENT_NO_SHOW";
                    activityMessage = `O cliente não compareceu ao agendamento de ${((_e = appointment.service) === null || _e === void 0 ? void 0 : _e.name) || 'serviço desconhecido'} em ${(0, date_fns_1.format)(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")}.`;
                }
                break;
            case client_1.AppointmentStatus.PENDING:
                if (isAdmin && currentStatus === client_1.AppointmentStatus.CANCELLED) {
                    allowed = true;
                    activityType = "APPOINTMENT_PENDING";
                    activityMessage = `Seu agendamento de ${((_f = appointment.service) === null || _f === void 0 ? void 0 : _f.name) || 'serviço desconhecido'} para ${(0, date_fns_1.format)(appointment.startTime, "dd/MM/yyyy 'às' HH:mm")} voltou para status pendente.`;
                }
                break;
        }
        if (!allowed) {
            return res.status(403).json({ message: `Transição de status inválida de ${currentStatus} para ${newStatus} ou permissão insuficiente.` });
        }
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.updateStatus(id, newStatus);
        try {
            if (activityType && activityMessage) {
                yield (0, activityLogService_1.logActivity)(appointment.userId, activityType, activityMessage, {
                    id: id,
                    type: "Appointment"
                });
            }
            if (gamificationEvent) {
                yield gamificationService_1.gamificationService.triggerEvent(appointment.userId, gamificationEvent, { relatedEntityId: id });
            }
        }
        catch (logError) {
            console.error("Error logging activity, sending notification, or triggering gamification:", logError);
        }
        return res.json(updatedAppointment);
    }
    catch (error) {
        console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
        next(error);
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Obter horários disponíveis para um serviço/profissional em uma data específica
const getAvailability = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { date, serviceId, professionalId: queryProfessionalId, companyId } = req.query;
    let professionalId = queryProfessionalId;
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
            const prof = yield professionalRepository_1.professionalRepository.findByUserId(req.user.id);
            if (prof) {
                professionalId = prof.id;
            }
            else {
                return res.status(400).json({ message: "É necessário fornecer 'professionalId' ou 'companyId', ou o usuário autenticado não possui perfil profissional." });
            }
        }
        else {
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
        const targetDate = (0, date_fns_1.parse)(date, 'yyyy-MM-dd', new Date());
        if (!(0, date_fns_1.isValid)(targetDate)) {
            return res.status(400).json({ message: "Formato de data inválido. Use YYYY-MM-DD." });
        }
        const service = yield serviceRepository_1.serviceRepository.findById(serviceId);
        const duration = service ? (0, exports.parseDuration)(service.duration) : null;
        if (!service || duration === null || duration <= 0) { // Check duration validity
            return res.status(404).json({ message: "Serviço não encontrado ou duração inválida." });
        }
        let professionalsToCheck = [];
        if (professionalId) {
            // Use the corrected payload type
            const professional = yield professionalRepository_1.professionalRepository.findById(professionalId);
            if (!professional) {
                return res.status(404).json({ message: "Profissional não encontrado." });
            }
            // Check if this professional offers the service (using included services)
            const offersService = professional.services.some(ps => ps.serviceId === serviceId);
            if (!offersService) {
                return res.status(400).json({ message: "O profissional especificado não oferece este serviço." });
            }
            // Cast to ProfessionalForAvailability if structure matches (might need adjustment)
            professionalsToCheck.push(professional);
        }
        else if (companyId) {
            // Find professionals in the company who offer the service
            // Adjust findMany to include necessary relations
            professionalsToCheck = (yield professionalRepository_1.professionalRepository.findMany({
                companyId: companyId,
                services: { some: { serviceId: serviceId } }
            }, {}, 0, 1000 // Consider pagination limit
            )); // Cast result
            if (professionalsToCheck.length === 0) {
                return res.json({ availableSlots: [] }); // No professionals in this company offer this service
            }
        }
        // --- Availability Calculation --- 
        const allAvailableSlots = {}; // Store slots per professional
        const intervalMinutes = 15; // Slot interval
        for (const prof of professionalsToCheck) {
            const profId = prof.id;
            allAvailableSlots[profId] = [];
            // Access professional and company working hours
            const workingHoursJson = prof.workingHours || ((_a = prof.company) === null || _a === void 0 ? void 0 : _a.workingHours) || null;
            const workingHoursToday = (0, exports.getWorkingHoursForDay)(workingHoursJson, targetDate);
            if (!workingHoursToday) {
                continue; // Skip if not working
            }
            // Debug log working hours
            console.log(`Using working hours for professional ${profId}: ${(0, date_fns_1.format)(workingHoursToday.start, 'HH:mm')} to ${(0, date_fns_1.format)(workingHoursToday.end, 'HH:mm')}`);
            // Retrieve existing appointments and blocks
            const dayStart = (0, date_fns_1.startOfDay)(targetDate);
            const dayEnd = (0, date_fns_1.endOfDay)(targetDate);
            const existingAppointments = yield appointmentRepository_1.appointmentRepository.findMany({
                professionalId: profId,
                status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED, client_1.AppointmentStatus.IN_PROGRESS] },
                startTime: { gte: dayStart, lt: dayEnd },
            });
            const scheduleBlocks = yield scheduleBlockRepository_1.scheduleBlockRepository.findMany({
                where: {
                    professionalId: profId,
                    startTime: { lt: dayEnd },
                    endTime: { gt: dayStart },
                }
            });
            // Iterate through potential slots
            let currentSlotStart = workingHoursToday.start;
            while (currentSlotStart < workingHoursToday.end) {
                const potentialSlotEnd = (0, date_fns_1.addMinutes)(currentSlotStart, duration);
                if (potentialSlotEnd > workingHoursToday.end)
                    break;
                let isSlotAvailable = true;
                // Check appointment conflicts
                for (const appt of existingAppointments) {
                    if (currentSlotStart < appt.endTime && potentialSlotEnd > appt.startTime) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (!isSlotAvailable) {
                    currentSlotStart = (0, date_fns_1.addMinutes)(currentSlotStart, intervalMinutes);
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
                    currentSlotStart = (0, date_fns_1.addMinutes)(currentSlotStart, intervalMinutes);
                    continue;
                }
                // Add available slot
                allAvailableSlots[profId].push((0, date_fns_1.format)(currentSlotStart, 'HH:mm'));
                currentSlotStart = (0, date_fns_1.addMinutes)(currentSlotStart, intervalMinutes);
            }
        }
        // Format response based on input (single professional or company)
        if (professionalId) {
            return res.json({ availableSlots: allAvailableSlots[professionalId] || [] });
        }
        else {
            // For company, return slots grouped by professional or a combined list?
            // Returning grouped by professional ID for now
            return res.json({ availabilityByProfessional: allAvailableSlots });
        }
    }
    catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
        next(error);
    }
});
exports.getAvailability = getAvailability;
// Add missing exports if they were removed or renamed
// Example: If getAppointmentAvailability was renamed to getAvailability
// export { getAvailability as getAppointmentAvailability };
// If cancelAppointment and deleteAppointment logic is needed, implement them
// export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { ... };
// export const deleteAppointment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { ... };
