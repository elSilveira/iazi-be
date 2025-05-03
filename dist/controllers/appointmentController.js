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
exports.getAppointmentAvailability = exports.deleteAppointment = exports.cancelAppointment = exports.updateAppointmentStatus = exports.createAppointment = exports.getAppointmentById = exports.getAllAppointments = void 0;
const appointmentRepository_1 = require("../repositories/appointmentRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
const professionalRepository_1 = require("../repositories/professionalRepository");
const client_1 = require("@prisma/client");
// Corrected: Use date-fns functions compatible with DateTime
const date_fns_1 = require("date-fns");
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Helper function to parse duration string (e.g., "60 min") into minutes
const parseDuration = (duration) => {
    var _a;
    const match = duration.match(/^(\d+)\s*(min|h)?$/i);
    if (!match)
        return null;
    const value = parseInt(match[1], 10);
    const unit = (_a = match[2]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (unit === 'h') {
        return value * 60;
    }
    return value; // Assume minutes if no unit or 'min'
};
// --- Controller Functions ---
// Obter todos os agendamentos (com filtros opcionais)
const getAllAppointments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Corrected: Filter by date (day), not startTime
    const { professionalId, companyId, status, date } = req.query;
    let userId = req.query.userId;
    if (!userId && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
        userId = req.user.id;
    }
    // Validar IDs se fornecidos
    if (userId && !isValidUUID(userId)) {
        res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
        return;
    }
    if (professionalId && !isValidUUID(professionalId)) {
        res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
        return;
    }
    // Corrected: CompanyId is not directly on Appointment, filter through professional or service
    // if (companyId && !isValidUUID(companyId as string)) {
    //   res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
    //   return;
    // }
    if (status && !Object.values(client_1.AppointmentStatus).includes(status)) {
        res.status(400).json({
            message: 'Status inválido. Valores permitidos: ' + Object.values(client_1.AppointmentStatus).join(', ')
        });
        return;
    }
    let parsedDate;
    if (date && typeof date === 'string') {
        try {
            // Corrected: Use parse for YYYY-MM-DD format
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
        if (userId)
            filters.userId = userId;
        if (professionalId)
            filters.professionalId = professionalId;
        if (status)
            filters.status = status;
        if (parsedDate) {
            // Corrected: Filter by 'date' field within the specific day
            filters.date = {
                gte: (0, date_fns_1.startOfDay)(parsedDate),
                lt: (0, date_fns_1.endOfDay)(parsedDate),
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
                filters.professional = { companyId: companyId, id: professionalId };
                delete filters.OR; // Remove the OR condition as professionalId is more specific
            }
        }
        // Require at least one primary filter (user, professional, company)
        if (!userId && !professionalId && !companyId) {
            res.status(400).json({ message: 'É necessário fornecer userId (ou estar autenticado), professionalId ou companyId para filtrar os agendamentos' });
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
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
        if (!appointment) {
            res.status(404).json({ message: 'Agendamento não encontrado' });
            return;
        }
        // Authorization check: User must own the appointment or be involved (e.g., professional)
        if (appointment.userId !== userId && appointment.professionalId /* && professionalId !== req.user.professionalProfileId */) {
            // Allow viewing for now, refine auth later
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
    var _a;
    // Corrected: Use 'date' (ISO string for DateTime) instead of startTime
    const { date, serviceId, professionalId, notes } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        const appointmentDate = (0, date_fns_1.parseISO)(date);
        if (!(0, date_fns_1.isValid)(appointmentDate)) {
            throw new Error('Formato de data inválido.');
        }
        // TODO: Check for conflicts / availability again before creating?
        const dataToCreate = {
            date: appointmentDate, // Use the Date object
            user: { connect: { id: userId } },
            service: { connect: { id: serviceId } },
            status: client_1.AppointmentStatus.PENDING, // Default status
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
        const newAppointment = yield appointmentRepository_1.appointmentRepository.create(dataToCreate);
        res.status(201).json(newAppointment);
    }
    catch (error) {
        console.error('Erro ao criar agendamento:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
});
exports.createAppointment = createAppointment;
// Atualizar o status de um agendamento
const updateAppointmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { status } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // For authorization
    // Validation handled by express-validator
    try {
        // Authorization: Check if user owns it or is the professional/admin
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
        if (!appointment) {
            res.status(404).json({ message: 'Agendamento não encontrado.' });
            return;
        }
        // Basic check: Allow user to cancel, allow professional/admin to change others
        if (appointment.userId !== userId && status === client_1.AppointmentStatus.CANCELLED) {
            // Allow user to cancel their own appointment
        }
        else if ( /* user is not professional/admin */false) {
            // res.status(403).json({ message: 'Não autorizado a mudar o status deste agendamento.' });
            // return;
        }
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.updateStatus(id, status);
        res.json(updatedAppointment);
    }
    catch (error) {
        console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Agendamento não encontrado para atualização.' });
            return;
        }
        next(error);
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Cancelar um agendamento
const cancelAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
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
        const updatedAppointment = yield appointmentRepository_1.appointmentRepository.updateStatus(id, client_1.AppointmentStatus.CANCELLED);
        res.json({
            message: 'Agendamento cancelado com sucesso',
            appointment: updatedAppointment
        });
    }
    catch (error) {
        console.error(`Erro ao cancelar agendamento ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Agendamento não encontrado para cancelamento.' });
            return;
        }
        next(error);
    }
});
exports.cancelAppointment = cancelAppointment;
// Deletar um agendamento (geralmente não recomendado)
const deleteAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Authorization check
        const appointment = yield appointmentRepository_1.appointmentRepository.findById(id);
        if (!appointment) {
            res.status(404).json({ message: 'Agendamento não encontrado.' });
            return;
        }
        if (appointment.userId !== userId /* && user is not admin */) {
            // res.status(403).json({ message: 'Não autorizado a deletar este agendamento.' });
            // return;
        }
        yield appointmentRepository_1.appointmentRepository.delete(id);
        res.status(204).send();
    }
    catch (error) {
        console.error(`Erro ao deletar agendamento ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Agendamento não encontrado para exclusão.' });
            return;
        }
        next(error);
    }
});
exports.deleteAppointment = deleteAppointment;
// --- Nova Função: Obter Disponibilidade --- 
const getAppointmentAvailability = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Corrected: Use 'date' (YYYY-MM-DD) from query
    const { date, serviceId, professionalId, companyId } = req.query;
    try {
        // 1. Determine Service Duration (Crucial for slot calculation)
        let serviceDurationMinutes = 60; // Default duration if no serviceId provided
        if (serviceId) {
            const service = yield serviceRepository_1.serviceRepository.findById(serviceId);
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
        const requestedDate = (0, date_fns_1.parse)(date, 'yyyy-MM-dd', new Date());
        if (!(0, date_fns_1.isValid)(requestedDate)) {
            res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
            return;
        }
        const dayStart = (0, date_fns_1.startOfDay)(requestedDate);
        const dayEnd = (0, date_fns_1.endOfDay)(requestedDate);
        // 4. Fetch existing appointments for the context (professional or company) on that day
        const appointmentFilters = {
            // Corrected: Filter by 'date' field
            date: {
                gte: dayStart,
                lt: dayEnd,
            },
            status: {
                // Corrected: Removed NO_SHOW
                notIn: [client_1.AppointmentStatus.CANCELLED],
            },
        };
        if (professionalId) {
            appointmentFilters.professionalId = professionalId;
        }
        else if (companyId) {
            // Corrected: Filter professionals by companyId, then filter appointments by those professionals
            const professionalsInCompany = yield professionalRepository_1.professionalRepository.findMany({ companyId: companyId }, {}, 0, 1000); // Find professionals in the company
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
        const existingAppointments = yield appointmentRepository_1.appointmentRepository.findMany(appointmentFilters);
        // 5. Generate Potential Slots and Check Availability
        const availableSlots = [];
        // Corrected: Use setHours, setMinutes, setSeconds for clarity
        let currentSlotTime = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(dayStart, workingHoursStart), 0), 0);
        const endOfWorkDay = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(dayStart, workingHoursEnd), 0), 0);
        while (currentSlotTime < endOfWorkDay) {
            const potentialEndTime = (0, date_fns_1.addMinutes)(currentSlotTime, serviceDurationMinutes);
            if (potentialEndTime > endOfWorkDay) {
                break;
            }
            let conflict = false;
            for (const appt of existingAppointments) {
                // Corrected: Use 'date' field for start time
                const apptStart = appt.date;
                // Corrected: Calculate apptEnd based on service duration associated with the appointment
                const apptService = yield serviceRepository_1.serviceRepository.findById(appt.serviceId); // Inefficient, consider including duration in appointment query
                const apptDuration = apptService ? parseDuration(apptService.duration) : null;
                if (apptDuration === null)
                    continue; // Skip if duration is invalid
                const apptEnd = (0, date_fns_1.addMinutes)(apptStart, apptDuration);
                // Check for overlap: (SlotStart < ApptEnd) and (SlotEnd > ApptStart)
                if (currentSlotTime < apptEnd && potentialEndTime > apptStart) {
                    conflict = true;
                    break;
                }
            }
            if (!conflict) {
                availableSlots.push((0, date_fns_1.format)(currentSlotTime, 'HH:mm'));
            }
            currentSlotTime = (0, date_fns_1.addMinutes)(currentSlotTime, slotIntervalMinutes);
        }
        res.json({ availableSlots });
    }
    catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
        next(error);
    }
});
exports.getAppointmentAvailability = getAppointmentAvailability;
