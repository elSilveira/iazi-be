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
const client_1 = require("@prisma/client");
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
        res.status(400).json({ message: 'Formato de ID do serviço inválido.' });
        return;
    }
    if (professionalId && !isValidUUID(professionalId)) {
        res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
        return;
    }
    if (companyId && !isValidUUID(companyId)) {
        res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
        return;
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
            res.status(400).json({
                message: "É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações"
            });
            return;
        }
        reviews = yield reviewRepository_1.reviewRepository.findMany(filters); // Assuming findMany exists
        res.json(reviews);
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
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const review = yield reviewRepository_1.reviewRepository.findById(id);
        if (!review) {
            res.status(404).json({ message: "Avaliação não encontrada" });
            return;
        }
        res.json(review);
    }
    catch (error) {
        console.error(`Erro ao buscar avaliação ${id}:`, error);
        next(error); // Pass error to error handler
    }
});
exports.getReviewById = getReviewById;
// Criar uma nova avaliação
const createReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { rating, comment, userId, serviceId, professionalId, companyId } = req.body;
    // Validação (Idealmente com express-validator)
    if (!rating || !userId || (!serviceId && !professionalId && !companyId)) {
        res.status(400).json({
            message: "Avaliação (rating), ID do usuário e pelo menos um ID de serviço, profissional ou empresa são obrigatórios"
        });
        return;
    }
    if (!isValidUUID(userId) || (serviceId && !isValidUUID(serviceId)) || (professionalId && !isValidUUID(professionalId)) || (companyId && !isValidUUID(companyId))) {
        res.status(400).json({ message: 'Formato de ID inválido para usuário, serviço, profissional ou empresa.' });
        return;
    }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
        return;
    }
    try {
        const dataToCreate = Object.assign(Object.assign(Object.assign({ rating: numericRating, comment: comment, user: { connect: { id: userId } } }, (serviceId && { service: { connect: { id: serviceId } } })), (professionalId && { professional: { connect: { id: professionalId } } })), (companyId && { company: { connect: { id: companyId } } }));
        const newReview = yield reviewRepository_1.reviewRepository.create(dataToCreate);
        res.status(201).json(newReview);
    }
    catch (error) {
        console.error('Erro ao criar avaliação:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos.' });
            return;
        }
        next(error); // Pass other errors to error handler
    }
});
exports.createReview = createReview;
// Atualizar uma avaliação existente
const updateReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    const _a = req.body, { userId, serviceId, professionalId, companyId } = _a, dataToUpdate = __rest(_a, ["userId", "serviceId", "professionalId", "companyId"]);
    if (dataToUpdate.rating !== undefined) {
        const numericRating = Number(dataToUpdate.rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
            return;
        }
        dataToUpdate.rating = numericRating;
    }
    try {
        const updatedReview = yield reviewRepository_1.reviewRepository.update(id, dataToUpdate);
        if (!updatedReview) {
            res.status(404).json({ message: "Avaliação não encontrada para atualização" });
            return;
        }
        res.json(updatedReview);
    }
    catch (error) {
        console.error(`Erro ao atualizar avaliação ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: "Avaliação não encontrada para atualização." });
            return;
        }
        next(error); // Pass other errors to error handler
    }
});
exports.updateReview = updateReview;
// Deletar uma avaliação
const deleteReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        res.status(400).json({ message: "Formato de ID inválido." });
        return;
    }
    try {
        const deletedReview = yield reviewRepository_1.reviewRepository.delete(id);
        if (!deletedReview) {
            res.status(404).json({ message: "Avaliação não encontrada para exclusão" });
            return;
        }
        // Use 204 No Content for successful deletion
        res.status(204).send();
    }
    catch (error) {
        console.error(`Erro ao deletar avaliação ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: "Avaliação não encontrada para exclusão." });
            return;
        }
        next(error); // Pass other errors to error handler
    }
});
exports.deleteReview = deleteReview;
