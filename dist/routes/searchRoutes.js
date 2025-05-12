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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const professionalRepository_1 = require("../repositories/professionalRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
const companyRepository_1 = __importDefault(require("../repositories/companyRepository"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Busca geral de profissionais, serviços e empresas (com vínculos)
 *     tags: [Search, Professionals, Services, Companies]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, professionals, services, companies]
 *         description: Tipo de entidade para buscar (all = tudo, professionals = apenas profissionais com serviços, services = apenas serviços com profissionais, companies = empresas com serviços)
 *     responses:
 *       200:
 *         description: Lista de resultados retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 professionals:
 *                   type: array
 *                   items:
 *                     type: object
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                 companies:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.query;
    let professionals = [];
    let services = [];
    let companies = [];
    if (!type || type === "all" || type === "professionals") {
        professionals = yield professionalRepository_1.professionalRepository.findMany({ services: { some: {} } }, { name: "asc" }, 0, 1000);
    }
    if (!type || type === "all" || type === "services") {
        services = yield serviceRepository_1.serviceRepository.findWithProfessionals();
    }
    if (!type || type === "all" || type === "companies") {
        companies = yield companyRepository_1.default.findMany({}, { name: "asc" }, 0, 1000);
    }
    res.json({ professionals, services, companies });
})));
exports.default = router;
