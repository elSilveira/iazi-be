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
// Função auxiliar para tratamento de erros
const handleError = (res, error, message) => {
    console.error(message, error);
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos.' });
        }
        if (error.code === 'P2025') {
            // O repositório já trata P2025 retornando null, mas podemos logar
            console.error("Prisma Error P2025: Record not found.");
            // Não retornamos aqui, pois o controlador já trata o null
        }
    }
    return res.status(500).json({ message: 'Erro interno do servidor' });
};
// Obter avaliações com filtros opcionais
const getReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, professionalId, companyId } = req.query;
    try {
        let reviews;
        if (serviceId) {
            reviews = yield reviewRepository_1.reviewRepository.findByService(serviceId);
        }
        else if (professionalId) {
            reviews = yield reviewRepository_1.reviewRepository.findByProfessional(professionalId);
        }
        else if (companyId) {
            reviews = yield reviewRepository_1.reviewRepository.findByCompany(companyId);
        }
        else {
            return res.status(400).json({
                message: "É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações"
            });
        }
        return res.json(reviews);
    }
    catch (error) {
        return handleError(res, error, 'Erro ao buscar avaliações:');
    }
});
exports.getReviews = getReviews;
// Obter uma avaliação específica pelo ID
const getReviewById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const review = yield reviewRepository_1.reviewRepository.findById(id);
        if (!review) {
            return res.status(404).json({ message: "Avaliação não encontrada" });
        }
        return res.json(review);
    }
    catch (error) {
        return handleError(res, error, `Erro ao buscar avaliação ${id}:`);
    }
});
exports.getReviewById = getReviewById;
// Criar uma nova avaliação
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extrair dados do corpo da requisição
    const { rating, comment, userId, serviceId, professionalId, companyId } = req.body;
    // Validação básica
    if (!rating || !userId || (!serviceId && !professionalId && !companyId)) {
        return res.status(400).json({
            message: "Avaliação (rating), ID do usuário e pelo menos um ID de serviço, profissional ou empresa são obrigatórios"
        });
    }
    // Validar a avaliação (rating)
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
    }
    try {
        // Montar o objeto de dados para o Prisma usando 'connect'
        const dataToCreate = Object.assign(Object.assign(Object.assign({ rating: numericRating, comment: comment, user: { connect: { id: userId } } }, (serviceId && { service: { connect: { id: serviceId } } })), (professionalId && { professional: { connect: { id: professionalId } } })), (companyId && { company: { connect: { id: companyId } } }));
        const newReview = yield reviewRepository_1.reviewRepository.create(dataToCreate);
        // TODO: Implementar lógica para atualizar a média de avaliação na entidade relacionada
        return res.status(201).json(newReview);
    }
    catch (error) {
        return handleError(res, error, 'Erro ao criar avaliação:');
    }
});
exports.createReview = createReview;
// Atualizar uma avaliação existente
const updateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Não permitir alterar userId, serviceId, professionalId, companyId via update
    const _a = req.body, { userId, serviceId, professionalId, companyId } = _a, dataToUpdate = __rest(_a, ["userId", "serviceId", "professionalId", "companyId"]);
    // Validar a avaliação (rating) se fornecida
    if (dataToUpdate.rating !== undefined) {
        const numericRating = Number(dataToUpdate.rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
        }
        dataToUpdate.rating = numericRating; // Garantir que seja número
    }
    try {
        const updatedReview = yield reviewRepository_1.reviewRepository.update(id, dataToUpdate);
        if (!updatedReview) {
            return res.status(404).json({ message: "Avaliação não encontrada para atualização" });
        }
        // TODO: Implementar lógica para recalcular a média de avaliação na entidade relacionada
        return res.json(updatedReview);
    }
    catch (error) {
        return handleError(res, error, `Erro ao atualizar avaliação ${id}:`);
    }
});
exports.updateReview = updateReview;
// Deletar uma avaliação
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedReview = yield reviewRepository_1.reviewRepository.delete(id);
        if (!deletedReview) {
            return res.status(404).json({ message: "Avaliação não encontrada para exclusão" });
        }
        // TODO: Implementar lógica para recalcular a média de avaliação na entidade relacionada
        return res.status(200).json({
            message: "Avaliação excluída com sucesso",
            review: deletedReview
        });
    }
    catch (error) {
        return handleError(res, error, `Erro ao deletar avaliação ${id}:`);
    }
});
exports.deleteReview = deleteReview;
