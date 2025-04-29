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
exports.deleteReview = exports.updateReview = exports.createReview = exports.getReviewById = exports.getReviews = void 0;
const reviewRepository_1 = require("../repositories/reviewRepository");
const client_1 = require("@prisma/client"); // Revertido: Importar de @prisma/client
// Obter avaliações com filtros opcionais
const getReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, professionalId, companyId } = req.query;
    try {
        let reviews;
        // Filtrar por serviço
        if (serviceId) {
            reviews = yield reviewRepository_1.reviewRepository.findByService(serviceId);
        }
        // Filtrar por profissional
        else if (professionalId) {
            reviews = yield reviewRepository_1.reviewRepository.findByProfessional(professionalId);
        }
        // Filtrar por empresa
        else if (companyId) {
            reviews = yield reviewRepository_1.reviewRepository.findByCompany(companyId);
        }
        // Caso contrário, retornar erro (exigir um filtro para evitar consultas muito grandes)
        else {
            return res.status(400).json({
                message: "É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações"
            });
        }
        return res.json(reviews);
    }
    catch (error) {
        console.error("Erro ao buscar avaliações:", error);
        return res.status(500).json({ message: "Erro interno do servidor" });
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
        console.error(`Erro ao buscar avaliação ${id}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.getReviewById = getReviewById;
// Criar uma nova avaliação
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    // Validação básica
    if (!data.rating || !data.userId || (!data.serviceId && !data.professionalId && !data.companyId)) {
        return res.status(400).json({
            message: "Avaliação (rating), ID do usuário e pelo menos um ID de serviço, profissional ou empresa são obrigatórios"
        });
    }
    // Validar a avaliação (rating)
    if (data.rating < 1 || data.rating > 5) {
        return res.status(400).json({ message: "A avaliação deve ser um valor entre 1 e 5" });
    }
    try {
        const newReview = yield reviewRepository_1.reviewRepository.create(data);
        // TODO: Implementar lógica para atualizar a média de avaliação na entidade relacionada
        // (Service, Professional ou Company) após criar a avaliação.
        return res.status(201).json(newReview);
    }
    catch (error) {
        console.error("Erro ao criar avaliação:", error);
        // Verificar erros de chave estrangeira
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            return res.status(400).json({ message: "Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.createReview = createReview;
// Atualizar uma avaliação existente
const updateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    // Validar a avaliação (rating) se fornecida
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
        return res.status(400).json({ message: "A avaliação deve ser um valor entre 1 e 5" });
    }
    try {
        const updatedReview = yield reviewRepository_1.reviewRepository.update(id, data);
        if (!updatedReview) {
            return res.status(404).json({ message: "Avaliação não encontrada para atualização" });
        }
        // TODO: Implementar lógica para recalcular a média de avaliação na entidade relacionada
        // após atualizar a avaliação.
        return res.json(updatedReview);
    }
    catch (error) {
        console.error(`Erro ao atualizar avaliação ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "Avaliação não encontrada para atualização." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
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
        // após deletar a avaliação.
        return res.status(200).json({
            message: "Avaliação excluída com sucesso",
            review: deletedReview
        });
    }
    catch (error) {
        console.error(`Erro ao deletar avaliação ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "Avaliação não encontrada para exclusão." });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});
exports.deleteReview = deleteReview;
