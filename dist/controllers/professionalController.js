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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeServiceFromMyProfessionalHandler = exports.addServiceToMyProfessionalHandler = exports.updateMyProfessionalHandler = exports.getMyProfessionalServicesHandler = exports.getMyProfessionalHandler = exports.removeServiceFromProfessionalHandler = exports.addServiceToProfessionalHandler = exports.deleteProfessionalHandler = exports.updateProfessionalHandler = exports.createProfessionalHandler = exports.getProfessionalByIdHandler = exports.getAllProfessionalsHandler = void 0;
const professionalRepository_1 = require("../repositories/professionalRepository");
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Helper to parse YYYY-MM or YYYY-MM-DD to Date (UTC, first day of month if day missing)
function parseToDateOrKeepUndefined(input) {
    if (!input)
        return new Date('1970-01-01T00:00:00.000Z'); // fallback to epoch (never null/undefined)
    if (/^\d{4}-\d{2}$/.test(input)) {
        return new Date(input + '-01T00:00:00.000Z');
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return new Date(input + 'T00:00:00.000Z');
    }
    // If already a Date or ISO string, just return
    return input;
}
// Helper to normalize education/educations to always return 'educations' as array
function normalizeEducations(professional) {
    if (Array.isArray(professional.educations))
        return professional.educations;
    if (Array.isArray(professional.education))
        return professional.education;
    return [];
}
const getAllProfessionalsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, q, role, serviceId, city, state, minRating, sort, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
        return;
    }
    const skip = (pageNum - 1) * limitNum;
    try {
        const filters = {};
        if (companyId && typeof companyId === 'string' && isValidUUID(companyId))
            filters.companyId = companyId;
        if (role)
            filters.role = { contains: role, mode: "insensitive" };
        if (serviceId && typeof serviceId === 'string' && isValidUUID(serviceId)) {
            filters.services = { some: { serviceId: serviceId } };
        }
        if (q) {
            const searchTerm = q;
            filters.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { role: { contains: searchTerm, mode: "insensitive" } },
                { company: { name: { contains: searchTerm, mode: "insensitive" } } },
                { services: { some: { service: { name: { contains: searchTerm, mode: "insensitive" } } } } },
            ];
        }
        const companyFilter = {};
        const addressFilter = {};
        if (city)
            addressFilter.city = { contains: city, mode: "insensitive" };
        if (state)
            addressFilter.state = { contains: state, mode: "insensitive" };
        if (Object.keys(addressFilter).length > 0) {
            companyFilter.address = addressFilter;
            filters.company = companyFilter;
        }
        if (minRating) {
            const ratingNum = parseFloat(minRating);
            if (!isNaN(ratingNum))
                filters.rating = { gte: ratingNum };
        }
        let orderBy = { name: "asc" };
        switch (sort) {
            case "rating_desc":
                orderBy = { rating: "desc" };
                break;
            case "name_asc":
                orderBy = { name: "asc" };
                break;
        }
        const professionals = yield professionalRepository_1.professionalRepository.findMany(filters, orderBy, skip, limitNum);
        const totalProfessionals = yield professionalRepository_1.professionalRepository.count(filters);
        res.json({
            data: professionals,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalProfessionals / limitNum),
                totalItems: totalProfessionals,
                itemsPerPage: limitNum,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllProfessionalsHandler = getAllProfessionalsHandler;
const getProfessionalByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const professional = yield professionalRepository_1.professionalRepository.findById(id);
        if (!professional) {
            res.status(404).json({ message: "Profissional não encontrado" });
            return;
        }
        const educations = normalizeEducations(professional);
        res.json(Object.assign(Object.assign({}, professional), { educations }));
    }
    catch (error) {
        next(error);
    }
});
exports.getProfessionalByIdHandler = getProfessionalByIdHandler;
const createProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, role, image, coverImage, bio, phone, companyId, experiences, educations, services, availability, portfolioItems } = req.body;
    const authUser = req.user;
    if (!authUser || !authUser.id) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    if (!name) {
        res.status(400).json({ message: "Nome do profissional não fornecido." });
        return;
    }
    try {
        const dataToCreate = Object.assign({ name,
            role,
            image, // imagem de perfil
            coverImage, // imagem de capa
            bio,
            phone, user: { connect: { id: authUser.id } } }, (companyId && isValidUUID(companyId) ? { company: { connect: { id: companyId } } } : {}));
        // Map services to serviceIds
        const serviceIds = Array.isArray(services) ? services.map((s) => s.serviceId) : (services === undefined ? undefined : []);
        // Map experiences
        const experiencesData = Array.isArray(experiences) ? experiences.map((exp) => ({
            title: exp.title,
            companyName: exp.companyName,
            startDate: parseToDateOrKeepUndefined(exp.startDate),
            endDate: parseToDateOrKeepUndefined(exp.endDate),
            description: exp.description,
        })) : (experiences === undefined ? undefined : []);
        // Map educations
        const educationsData = Array.isArray(educations) ? educations.map((edu) => ({
            institution: edu.institutionName,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: parseToDateOrKeepUndefined(edu.startDate),
            endDate: parseToDateOrKeepUndefined(edu.endDate),
            description: edu.description,
        })) : (educations === undefined ? undefined : []);
        // Map availability
        const availabilityData = Array.isArray(availability) ? availability.map((a) => ({
            dayOfWeek: a.day_of_week,
            startTime: a.start_time,
            endTime: a.end_time,
        })) : (availability === undefined ? undefined : []);
        // Map portfolio
        const portfolioData = Array.isArray(portfolioItems) ? portfolioItems.map((p) => ({
            imageUrl: p.imageUrl,
            description: p.description,
        })) : (portfolioItems === undefined ? undefined : []);
        // ATOMIC: Create professional and update user role in the same transaction
        const { prisma } = require("../lib/prisma");
        const newProfessional = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create professional
            const createdProfessional = yield tx.professional.create({ data: dataToCreate });
            // Update user role to PROFESSIONAL
            yield tx.user.update({
                where: { id: authUser.id },
                data: { role: "PROFESSIONAL" },
            });
            // Create related data (services, experiences, etc.)
            if (serviceIds && serviceIds.length > 0) {
                const serviceConnections = serviceIds.map((serviceId) => ({
                    professionalId: createdProfessional.id,
                    serviceId: serviceId,
                }));
                yield tx.professionalService.createMany({
                    data: serviceConnections,
                    skipDuplicates: true,
                });
            }
            if (experiencesData && experiencesData.length > 0) {
                yield tx.professionalExperience.createMany({
                    data: experiencesData.map((exp) => (Object.assign(Object.assign({}, exp), { professionalId: createdProfessional.id }))),
                });
            }
            if (educationsData && educationsData.length > 0) {
                yield tx.professionalEducation.createMany({
                    data: educationsData.map((edu) => (Object.assign(Object.assign({}, edu), { professionalId: createdProfessional.id }))),
                });
            }
            if (availabilityData && availabilityData.length > 0) {
                yield tx.professionalAvailabilitySlot.createMany({
                    data: availabilityData.map((slot) => (Object.assign(Object.assign({}, slot), { professionalId: createdProfessional.id }))),
                });
            }
            if (portfolioData && portfolioData.length > 0) {
                yield tx.professionalPortfolioItem.createMany({
                    data: portfolioData.map((item) => (Object.assign(Object.assign({}, item), { professionalId: createdProfessional.id }))),
                });
            }
            // Return the full professional with details
            return tx.professional.findUniqueOrThrow({
                where: { id: createdProfessional.id },
                include: professionalRepository_1.professionalRepository.includeDetails,
            });
        }));
        res.status(201).json(Object.assign(Object.assign({}, newProfessional), { educations: normalizeEducations(newProfessional) }));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: "Este usuário já possui um perfil profissional ou ocorreu um conflito de dados (ex: nome duplicado se houver restrição)." });
                return;
            }
            if (error.code === 'P2025') {
                res.status(400).json({ message: `Erro ao conectar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Registro relacionado não encontrado (ex: Empresa ou Usuário não existe)'}` });
                return;
            }
        }
        next(error);
    }
});
exports.createProfessionalHandler = createProfessionalHandler;
const updateProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const _b = req.body, { name, role, image, coverImage, bio, phone, companyId, experiences, educations, services, availability, portfolioItems, avatar } = _b, // ignorar se vier
    dataToUpdateFromRequest = __rest(_b, ["name", "role", "image", "coverImage", "bio", "phone", "companyId", "experiences", "educations", "services", "availability", "portfolioItems", "avatar"]);
    const authUser = req.user;
    if (!authUser || !authUser.id) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    try {
        const professionalToUpdate = yield professionalRepository_1.professionalRepository.findById(id);
        if (!professionalToUpdate) {
            res.status(404).json({ message: "Perfil profissional não encontrado." });
            return;
        }
        if (professionalToUpdate.userId !== authUser.id && authUser.role !== 'ADMIN' && authUser.role !== 'COMPANY_OWNER') {
            // Permissão
        }
        const updatePayload = Object.assign(Object.assign({}, dataToUpdateFromRequest), { name,
            role,
            image,
            coverImage,
            bio,
            phone });
        if ('companyId' in updatePayload)
            delete updatePayload.companyId;
        if ('userId' in updatePayload)
            delete updatePayload.userId;
        if ('avatar' in updatePayload)
            delete updatePayload.avatar;
        // Map services to serviceIds
        const serviceIds = Array.isArray(services) ? services.map((s) => s.serviceId) : undefined;
        // Map experiences
        const experiencesData = Array.isArray(experiences) ? experiences.map((exp) => ({
            title: exp.title,
            companyName: exp.companyName,
            startDate: parseToDateOrKeepUndefined(exp.startDate),
            endDate: parseToDateOrKeepUndefined(exp.endDate),
            description: exp.description,
        })) : undefined;
        // Map educations
        const educationsData = Array.isArray(educations) ? educations.map((edu) => ({
            institution: edu.institutionName,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: parseToDateOrKeepUndefined(edu.startDate),
            endDate: parseToDateOrKeepUndefined(edu.endDate),
            description: edu.description,
        })) : undefined;
        // Map availability
        const availabilityData = Array.isArray(availability) ? availability.map((a) => ({
            dayOfWeek: a.day_of_week,
            startTime: a.start_time,
            endTime: a.end_time,
        })) : undefined;
        // Map portfolio
        const portfolioData = Array.isArray(portfolioItems) ? portfolioItems.map((p) => ({
            imageUrl: p.imageUrl,
            description: p.description,
        })) : undefined;
        const updatedProfessional = yield professionalRepository_1.professionalRepository.update(id, updatePayload, serviceIds, experiencesData, educationsData, availabilityData, portfolioData);
        res.json(Object.assign(Object.assign({}, updatedProfessional), { educations: normalizeEducations(updatedProfessional) }));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: `Erro ao atualizar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado ou registro relacionado ausente'}` });
            return;
        }
        next(error);
    }
});
exports.updateProfessionalHandler = updateProfessionalHandler;
const deleteProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    try {
        yield professionalRepository_1.professionalRepository.delete(id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: `Erro ao deletar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado'}` });
            return;
        }
        next(error);
    }
});
exports.deleteProfessionalHandler = deleteProfessionalHandler;
const addServiceToProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { professionalId } = req.params;
    const { serviceId } = req.body;
    if (!isValidUUID(professionalId) || !isValidUUID(serviceId)) {
        res.status(400).json({ message: "IDs inválidos." });
        return;
    }
    try {
        // Check if professional exists
        const professional = yield professionalRepository_1.professionalRepository.findById(professionalId);
        if (!professional) {
            res.status(404).json({ message: "Profissional não encontrado." });
            return;
        }
        // Check if service exists
        const service = yield prisma_1.prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            res.status(404).json({ message: "Serviço não encontrado." });
            return;
        }
        // Link professional to service (ignore duplicate error)
        try {
            yield require("../repositories/serviceRepository").serviceRepository.linkProfessionalToService(professionalId, serviceId);
        }
        catch (err) {
            if (err.code !== 'P2002')
                throw err; // Ignore duplicate
        }
        // Return updated professional with pluralized arrays
        const updatedProfessional = yield professionalRepository_1.professionalRepository.findById(professionalId);
        if (!updatedProfessional) {
            res.status(404).json({ message: "Profissional não encontrado após associação." });
            return;
        }
        const flatServices = (updatedProfessional.services || []).map((ps) => ps.service);
        const educations = normalizeEducations(updatedProfessional);
        res.status(201).json(Object.assign(Object.assign({}, updatedProfessional), { services: flatServices, educations }));
    }
    catch (error) {
        next(error);
    }
});
exports.addServiceToProfessionalHandler = addServiceToProfessionalHandler;
const removeServiceFromProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { professionalId, serviceId } = req.params;
    if (!isValidUUID(professionalId) || !isValidUUID(serviceId)) {
        res.status(400).json({ message: "IDs inválidos." });
        return;
    }
    try {
        // Check if professional exists
        const professional = yield professionalRepository_1.professionalRepository.findById(professionalId);
        if (!professional) {
            res.status(404).json({ message: "Profissional não encontrado." });
            return;
        }
        // Check if service exists
        const service = yield prisma_1.prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            res.status(404).json({ message: "Serviço não encontrado." });
            return;
        }
        // Unlink professional from service
        yield require("../repositories/serviceRepository").serviceRepository.unlinkProfessionalFromService(professionalId, serviceId);
        // Return updated professional with pluralized arrays
        const updatedProfessional = yield professionalRepository_1.professionalRepository.findById(professionalId);
        if (!updatedProfessional) {
            res.status(404).json({ message: "Profissional não encontrado após desassociação." });
            return;
        }
        const flatServices = (updatedProfessional.services || []).map((ps) => ps.service);
        const educations = normalizeEducations(updatedProfessional);
        res.status(200).json(Object.assign(Object.assign({}, updatedProfessional), { services: flatServices, educations, message: "Serviço desassociado com sucesso" }));
    }
    catch (error) {
        // If not found, return 404
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') {
            res.status(404).json({ message: "Associação não encontrada." });
            return;
        }
        next(error);
    }
});
exports.removeServiceFromProfessionalHandler = removeServiceFromProfessionalHandler;
const getMyProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: "Usuário não autenticado." });
            return;
        }
        const professional = yield professionalRepository_1.professionalRepository.findByUserId(userId);
        if (!professional) {
            res.status(404).json({ message: "Perfil profissional não encontrado." });
            return;
        }
        // Map the join table to a flat array of service objects
        const flatServices = (professional.services || []).map((ps) => ps.service);
        // Always return 'educations' (plural) for array
        const educations = normalizeEducations(professional);
        // Determine userRole based on professional/company presence
        let userRole = 'USER';
        if (professional.companyId) {
            userRole = 'COMPANY';
        }
        else if (professional.id) {
            userRole = 'PROFESSIONAL';
        }
        res.json(Object.assign(Object.assign({}, professional), { services: flatServices, educations, userRole }));
    }
    catch (error) {
        next(error);
    }
});
exports.getMyProfessionalHandler = getMyProfessionalHandler;
// GET /api/professionals/me/services - List all services for the authenticated professional (with join fields)
const getMyProfessionalServicesHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: "Usuário não autenticado." });
            return;
        }
        // Find the professional profile for this user
        const professional = yield professionalRepository_1.professionalRepository.findByUserId(userId);
        if (!professional) {
            res.status(404).json({ message: "Perfil profissional não encontrado." });
            return;
        }
        // Get all services linked to this professional (with join fields)
        const services = yield require("../repositories/serviceRepository").serviceRepository.getServicesByProfessional(professional.id);
        res.json(services.map((ps) => (Object.assign(Object.assign({}, ps.service), { price: ps.price, schedule: ps.schedule, description: ps.description }))));
    }
    catch (error) {
        next(error);
    }
});
exports.getMyProfessionalServicesHandler = getMyProfessionalServicesHandler;
const updateMyProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authUser = req.user;
    if (!authUser || !authUser.id) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    try {
        // Find professional profile by userId
        const professional = yield professionalRepository_1.professionalRepository.findByUserId(authUser.id);
        if (!professional) {
            res.status(404).json({ message: "Perfil profissional não encontrado." });
            return;
        }
        // Only allow owner or admin
        if (professional.userId !== authUser.id && authUser.role !== 'ADMIN' && authUser.role !== 'COMPANY_OWNER') {
            res.status(403).json({ message: "Acesso negado." });
            return;
        }
        // Use the same update logic as updateProfessionalHandler
        const _b = req.body, { name, role, image, coverImage, bio, phone, companyId, experiences, educations, services, availability, portfolioItems, avatar } = _b, // ignorar se vier
        dataToUpdateFromRequest = __rest(_b, ["name", "role", "image", "coverImage", "bio", "phone", "companyId", "experiences", "educations", "services", "availability", "portfolioItems", "avatar"]);
        const updatePayload = Object.assign(Object.assign({}, dataToUpdateFromRequest), { name,
            role,
            image,
            coverImage,
            bio,
            phone });
        if ('companyId' in updatePayload)
            delete updatePayload.companyId;
        if ('userId' in updatePayload)
            delete updatePayload.userId;
        if ('avatar' in updatePayload)
            delete updatePayload.avatar;
        // Map services to serviceIds
        const serviceIds = req.body.hasOwnProperty('services') ? (Array.isArray(services) ? services.map((s) => s.serviceId) : []) : undefined;
        // Map experiences
        const experiencesData = req.body.hasOwnProperty('experiences') ? (Array.isArray(experiences) ? experiences.map((exp) => ({
            title: exp.title,
            companyName: exp.companyName,
            startDate: parseToDateOrKeepUndefined(exp.startDate),
            endDate: parseToDateOrKeepUndefined(exp.endDate),
            description: exp.description,
        })) : []) : undefined;
        // Map educations
        const educationsData = req.body.hasOwnProperty('educations') ? (Array.isArray(educations) ? educations.map((edu) => ({
            institution: edu.institutionName,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: parseToDateOrKeepUndefined(edu.startDate),
            endDate: parseToDateOrKeepUndefined(edu.endDate),
            description: edu.description,
        })) : []) : undefined;
        // Map availability
        const availabilityData = req.body.hasOwnProperty('availability') ? (Array.isArray(availability) ? availability.map((a) => ({
            dayOfWeek: a.day_of_week,
            startTime: a.start_time,
            endTime: a.end_time,
        })) : []) : undefined;
        // Map portfolio
        const portfolioData = req.body.hasOwnProperty('portfolioItems') ? (Array.isArray(portfolioItems) ? portfolioItems.map((p) => ({
            imageUrl: p.imageUrl,
            description: p.description,
        })) : []) : undefined;
        const updatedProfessional = yield professionalRepository_1.professionalRepository.update(professional.id, updatePayload, serviceIds, experiencesData, educationsData, availabilityData, portfolioData);
        // Re-fetch to ensure fresh join data
        const freshProfessional = yield professionalRepository_1.professionalRepository.findByUserId(authUser.id);
        if (!freshProfessional) {
            res.status(404).json({ message: "Perfil profissional não encontrado após atualização." });
            return;
        }
        const flatServices = (freshProfessional.services || []).map((ps) => ps.service);
        const educationsArr = normalizeEducations(freshProfessional);
        let userRole = 'USER';
        if (freshProfessional.companyId) {
            userRole = 'COMPANY';
        }
        else if (freshProfessional.id) {
            userRole = 'PROFESSIONAL';
        }
        res.json(Object.assign(Object.assign({}, freshProfessional), { services: flatServices, educations: educationsArr, userRole }));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: `Erro ao atualizar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado ou registro relacionado ausente'}` });
            return;
        }
        next(error);
    }
});
exports.updateMyProfessionalHandler = updateMyProfessionalHandler;
// POST /api/professionals/me/services - Link a service to the authenticated professional (with price, schedule, description)
const addServiceToMyProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // DEBUG: Log user context and userId
        console.log('DEBUG addServiceToMyProfessionalHandler req.user:', req.user);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { serviceId, price, schedule, description } = req.body;
        if (!userId) {
            res.status(401).json({ message: "Usuário não autenticado." });
            return;
        }
        if (!isValidUUID(serviceId)) {
            res.status(400).json({ message: "serviceId inválido." });
            return;
        }
        if (schedule && !Array.isArray(schedule)) {
            res.status(400).json({ message: "schedule deve ser um array de objetos." });
            return;
        }
        // DEBUG: Log professional lookup
        const professional = yield professionalRepository_1.professionalRepository.findByUserId(userId);
        console.log('DEBUG addServiceToMyProfessionalHandler professional:', professional);
        if (!professional) {
            res.status(404).json({ message: "Perfil profissional não encontrado." });
            return;
        }
        const service = yield prisma_1.prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            res.status(404).json({ message: "Serviço não encontrado." });
            return;
        }
        try {
            yield require("../repositories/serviceRepository").serviceRepository.linkProfessionalToService(professional.id, serviceId, price, schedule, description);
        }
        catch (err) {
            if (err.code !== 'P2002')
                throw err;
        }
        // Return updated professional (with pluralized arrays)
        const updatedProfessional = yield professionalRepository_1.professionalRepository.findByUserId(userId);
        const flatServices = ((updatedProfessional === null || updatedProfessional === void 0 ? void 0 : updatedProfessional.services) || []).map((ps) => ps.service);
        const educations = normalizeEducations(updatedProfessional);
        res.status(201).json(Object.assign(Object.assign({}, updatedProfessional), { services: flatServices, educations }));
    }
    catch (error) {
        next(error);
    }
});
exports.addServiceToMyProfessionalHandler = addServiceToMyProfessionalHandler;
// DELETE /api/professionals/me/services/:serviceId - Unlink a service from the authenticated professional
const removeServiceFromMyProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { serviceId } = req.params;
        if (!userId || !serviceId) {
            res.status(400).json({ message: "Usuário ou serviceId ausente." });
            return;
        }
        if (!isValidUUID(serviceId)) {
            res.status(400).json({ message: "serviceId inválido." });
            return;
        }
        const professional = yield professionalRepository_1.professionalRepository.findByUserId(userId);
        if (!professional) {
            res.status(404).json({ message: "Perfil profissional não encontrado." });
            return;
        }
        yield require("../repositories/serviceRepository").serviceRepository.unlinkProfessionalFromService(professional.id, serviceId);
        // Return updated list
        const services = yield require("../repositories/serviceRepository").serviceRepository.getServicesByProfessional(professional.id);
        res.status(200).json(services.map((ps) => (Object.assign(Object.assign({}, ps.service), { price: ps.price, schedule: ps.schedule, description: ps.description }))));
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') {
            res.status(404).json({ message: "Associação não encontrada." });
            return;
        }
        next(error);
    }
});
exports.removeServiceFromMyProfessionalHandler = removeServiceFromMyProfessionalHandler;
