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
exports.removeServiceFromProfessionalHandler = exports.addServiceToProfessionalHandler = exports.deleteProfessionalHandler = exports.updateProfessionalHandler = exports.createProfessionalHandler = exports.getProfessionalByIdHandler = exports.getAllProfessionalsHandler = void 0;
const professionalRepository_1 = require("../repositories/professionalRepository");
const client_1 = require("@prisma/client");
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
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
        console.error("Erro ao buscar profissionais:", error);
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
        res.json(professional);
    }
    catch (error) {
        console.error(`Erro ao buscar profissional ${id}:`, error);
        next(error);
    }
});
exports.getProfessionalByIdHandler = getProfessionalByIdHandler;
const createProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, role, image, companyId, serviceIds, bio, phone, experiences, // Existing in schema as ProfessionalExperience
    education, // Existing in schema as ProfessionalEducation
    availability, // Newly added as ProfessionalAvailabilitySlot
    portfolio // Newly added as ProfessionalPortfolioItem
     } = req.body;
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
        const dataToCreate = Object.assign({ name: name, role: role || "Profissional", image: image, bio: bio, phone: phone, user: { connect: { id: authUser.id } } }, (companyId && isValidUUID(companyId) && { company: { connect: { id: companyId } } }));
        const newProfessional = yield professionalRepository_1.professionalRepository.create(dataToCreate, serviceIds, experiences, education, availability, portfolio);
        res.status(201).json(newProfessional);
    }
    catch (error) {
        console.error("Erro ao criar profissional:", error);
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
    const { id } = req.params; // ID of the professional profile to update
    const _b = req.body, { serviceIds, bio, phone, experiences, // Existing in schema as ProfessionalExperience
    education, // Existing in schema as ProfessionalEducation
    availability, // Newly added as ProfessionalAvailabilitySlot
    portfolio } = _b, // Newly added as ProfessionalPortfolioItem
    dataToUpdateFromRequest = __rest(_b, ["serviceIds", "bio", "phone", "experiences", "education", "availability", "portfolio"]);
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
            // This check might be redundant if middleware is comprehensive
            // console.warn("Tentativa de atualização não autorizada bloqueada no controller, verificar middleware.");
            // res.status(403).json({ message: "Você não tem permissão para atualizar este perfil." });
            // return;
        }
        const updatePayload = Object.assign(Object.assign({}, dataToUpdateFromRequest), { bio: bio, phone: phone });
        if (updatePayload.rating !== undefined && typeof updatePayload.rating === 'string') {
            updatePayload.rating = parseFloat(updatePayload.rating);
        }
        if (updatePayload.totalReviews !== undefined && typeof updatePayload.totalReviews === 'string') {
            updatePayload.totalReviews = parseInt(updatePayload.totalReviews, 10);
        }
        if ('companyId' in updatePayload)
            delete updatePayload.companyId;
        if ('userId' in updatePayload)
            delete updatePayload.userId;
        const updatedProfessional = yield professionalRepository_1.professionalRepository.update(id, updatePayload, serviceIds, experiences, education, availability, portfolio);
        res.json(updatedProfessional);
    }
    catch (error) {
        console.error(`Erro ao atualizar profissional ${id}:`, error);
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
        console.error(`Erro ao deletar profissional ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: `Erro ao deletar: ${((_a = error.meta) === null || _a === void 0 ? void 0 : _a.cause) || 'Profissional não encontrado'}` });
            return;
        }
        next(error);
    }
});
exports.deleteProfessionalHandler = deleteProfessionalHandler;
// Placeholder for future implementation if needed
const addServiceToProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { professionalId, serviceId } = req.params;
    res.status(501).json({ message: "Not Implemented" });
    return;
});
exports.addServiceToProfessionalHandler = addServiceToProfessionalHandler;
const removeServiceFromProfessionalHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { professionalId, serviceId } = req.params;
    res.status(501).json({ message: "Not Implemented" });
    return;
});
exports.removeServiceFromProfessionalHandler = removeServiceFromProfessionalHandler;
