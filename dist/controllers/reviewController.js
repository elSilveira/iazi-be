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
exports.deleteReview = exports.updateReview = exports.createReview = exports.getReviewById = exports.getReviews = void 0;
const reviewRepository_1 = require("../repositories/reviewRepository");
const prisma_1 = require("../lib/prisma"); // Correctly import prisma client
const client_1 = require("@prisma/client"); // Import UserRole
const gamificationService_1 = require("../services/gamificationService"); // Import gamification service
const activityLogService_1 = require("../services/activityLogService"); // Import activity log service
// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
};
// Obter avaliações com filtros opcionais
const getReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, professionalId, companyId } = req.query;
    // Validar IDs se fornecidos
    if (serviceId && !isValidUUID(serviceId)) {
        // Return the response directly
        return res.status(400).json({ message: 'Formato de ID do serviço inválido.' });
    }
    if (professionalId && !isValidUUID(professionalId)) {
        // Return the response directly
        return res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
    }
    if (companyId && !isValidUUID(companyId)) {
        // Return the response directly
        return res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
    }
    try {
        let reviews;
        const filters = {};
        if (serviceId)
            filters.serviceId = serviceId;
        if (professionalId)
            filters.professionalId = professionalId;
        if (companyId)
            filters.companyId = companyId;
        // Exigir pelo menos um filtro
        if (!serviceId && !professionalId && !companyId) {
            // Return the response directly
            return res.status(400).json({
                message: "É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações"
            });
        }
        reviews = yield reviewRepository_1.reviewRepository.findMany(filters); // Assuming findMany exists
        // Return the response
        return res.json(reviews);
    }
    catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        next(error); // Pass error to error handler
    }
});
exports.getReviews = getReviews;
// Obter uma avaliação específica pelo ID
const getReviewById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        // Return the response directly
        return res.status(400).json({ message: "Formato de ID inválido." });
    }
    try {
        const review = yield reviewRepository_1.reviewRepository.findById(id);
        if (!review) {
            // Return the response directly
            return res.status(404).json({ message: "Avaliação não encontrada" });
        }
        // Return the response
        return res.json(review);
    }
    catch (error) {
        console.error(`Erro ao buscar avaliação ${id}:`, error);
        next(error); // Pass error to error handler
    }
});
exports.getReviewById = getReviewById;
// Criar uma nova avaliação
const createReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Use authenticated user ID instead of taking it from body
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { rating, comment, serviceId, professionalId, companyId } = req.body;
    if (!userId) {
        // Return the response directly
        return res.status(401).json({ message: "Usuário não autenticado." });
    }
    // Validação (Idealmente com express-validator)
    if (!rating || (!serviceId && !professionalId && !companyId)) {
        // Return the response directly
        return res.status(400).json({
            message: "Avaliação (rating) e pelo menos um ID de serviço, profissional ou empresa são obrigatórios"
        });
    }
    if ((serviceId && !isValidUUID(serviceId)) || (professionalId && !isValidUUID(professionalId)) || (companyId && !isValidUUID(companyId))) {
        // Return the response directly
        return res.status(400).json({ message: 'Formato de ID inválido para serviço, profissional ou empresa.' });
    }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        // Return the response directly
        return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
    }
    try {
        const dataToCreate = Object.assign(Object.assign(Object.assign({ rating: numericRating, comment: comment, user: { connect: { id: userId } } }, (serviceId && { service: { connect: { id: serviceId } } })), (professionalId && { professional: { connect: { id: professionalId } } })), (companyId && { company: { connect: { id: companyId } } }));
        const newReview = yield reviewRepository_1.reviewRepository.create(dataToCreate);
        // --- GAMIFICATION INTEGRATION START ---
        // Trigger REVIEW_CREATED event after successful creation
        // Run this asynchronously, don't block the review creation response
        gamificationService_1.gamificationService.triggerEvent(userId, gamificationService_1.GamificationEventType.REVIEW_CREATED, {
            relatedEntityId: newReview.id,
            relatedEntityType: "Review",
        }).catch(err => console.error("Gamification event trigger failed for REVIEW_CREATED:", err));
        // --- GAMIFICATION INTEGRATION END ---
        // --- ACTIVITY LOG INTEGRATION START ---
        // Log activity after successful review creation
        let targetName = 'item'; // Default target name
        try {
            if (serviceId) {
                const service = yield prisma_1.prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } });
                if (service)
                    targetName = `serviço ${service.name}`;
            }
            else if (professionalId) {
                const professional = yield prisma_1.prisma.professional.findUnique({ where: { id: professionalId }, select: { name: true } });
                if (professional)
                    targetName = `profissional ${professional.name}`;
            }
            else if (companyId) {
                const company = yield prisma_1.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
                if (company)
                    targetName = `empresa ${company.name}`;
            }
        }
        catch (fetchError) {
            console.error("Error fetching entity name for activity log:", fetchError);
        }
        yield (0, activityLogService_1.logActivity)(userId, 'NEW_REVIEW', `Você avaliou o ${targetName} com ${numericRating} estrela(s).`, { id: newReview.id, type: 'Review' }).catch(err => console.error("Activity logging failed for NEW_REVIEW:", err));
        // --- ACTIVITY LOG INTEGRATION END ---
        // Return the response
        return res.status(201).json(newReview);
    }
    catch (error) {
        console.error('Erro ao criar avaliação:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            // Return the response directly
            return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos.' });
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // This might happen if service/professional/company ID is invalid
            // Return the response directly
            return res.status(404).json({ message: 'Entidade relacionada (serviço, profissional ou empresa) não encontrada.' });
        }
        next(error); // Pass other errors to error handler
    }
});
exports.createReview = createReview;
// Atualizar uma avaliação existente
const updateReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!authenticatedUserId) {
        // Return the response directly
        return res.status(401).json({ message: "Usuário não autenticado." });
    }
    if (!isValidUUID(id)) {
        // Return the response directly
        return res.status(400).json({ message: "Formato de ID inválido." });
    }
    // Exclude fields that should not be updatable directly from body
    const _c = req.body, { userId, serviceId, professionalId, companyId, createdAt, updatedAt } = _c, dataToUpdate = __rest(_c, ["userId", "serviceId", "professionalId", "companyId", "createdAt", "updatedAt"]);
    if (dataToUpdate.rating !== undefined) {
        const numericRating = Number(dataToUpdate.rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            // Return the response directly
            return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
        }
        dataToUpdate.rating = numericRating;
    }
    try {
        // Authorization: Check if user is owner or admin
        const existingReview = yield reviewRepository_1.reviewRepository.findById(id);
        if (!existingReview) {
            // Return the response directly
            return res.status(404).json({ message: "Avaliação não encontrada para atualização" });
        }
        // Ensure userRole is compared against the enum member
        if (existingReview.userId !== authenticatedUserId && userRole !== client_1.UserRole.ADMIN) {
            // Return the response directly
            return res.status(403).json({ message: "Não autorizado a atualizar esta avaliação." });
        }
        // Check if there's anything to update
        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
        }
        const updatedReview = yield reviewRepository_1.reviewRepository.update(id, dataToUpdate);
        // No need to check for null here as Prisma throws P2025 if not found, handled below
        // Return the response
        return res.json(updatedReview);
    }
    catch (error) {
        console.error(`Erro ao atualizar avaliação ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // Return the response directly
            return res.status(404).json({ message: "Avaliação não encontrada para atualização." });
        }
        next(error); // Pass other errors to error handler
    }
});
exports.updateReview = updateReview;
// Deletar uma avaliação
const deleteReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!authenticatedUserId) {
        // Return the response directly
        return res.status(401).json({ message: "Usuário não autenticado." });
    }
    if (!isValidUUID(id)) {
        // Return the response directly
        return res.status(400).json({ message: "Formato de ID inválido." });
    }
    try {
        // Authorization: Check if user is owner or admin
        const existingReview = yield reviewRepository_1.reviewRepository.findById(id);
        if (!existingReview) {
            // Return the response directly
            return res.status(404).json({ message: "Avaliação não encontrada para exclusão" });
        }
        // Ensure userRole is compared against the enum member
        if (existingReview.userId !== authenticatedUserId && userRole !== client_1.UserRole.ADMIN) {
            // Return the response directly
            return res.status(403).json({ message: "Não autorizado a deletar esta avaliação." });
        }
        yield reviewRepository_1.reviewRepository.delete(id);
        // No need to check for null here as Prisma throws P2025 if not found, handled below
        // Use 204 No Content for successful deletion
        // Return the response
        return res.status(204).send();
    }
    catch (error) {
        console.error(`Erro ao deletar avaliação ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // Return the response directly
            return res.status(404).json({ message: "Avaliação não encontrada para exclusão." });
        }
        next(error); // Pass other errors to error handler
    }
});
exports.deleteReview = deleteReview;
