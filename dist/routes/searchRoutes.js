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
router.get("/", (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, q, category, sort, page = "1", limit = "10", professionalTipo } = req.query;
    let professionals = [];
    let services = [];
    let companies = [];
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    let orderBy = { name: "asc" };
    if (sort === "rating")
        orderBy = { rating: "desc" };
    try {
        // Professionals
        const professionalFilters = {};
        if (q)
            professionalFilters.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { role: { contains: q, mode: "insensitive" } }
            ];
        if (category)
            professionalFilters.services = {
                some: { service: { category: { name: { contains: category, mode: "insensitive" } } } }
            };
        // Only set role if professionalTipo is provided and not 'all'
        if (professionalTipo && professionalTipo !== 'all') {
            professionalFilters.role = { contains: professionalTipo, mode: "insensitive" };
        }
        professionals = yield professionalRepository_1.professionalRepository.findMany(professionalFilters, orderBy, skip, limitNum);
        professionals = professionals.map(prof => ({
            id: prof.id,
            name: prof.name,
            role: prof.role,
            rating: prof.rating,
            services: (prof.services || []).map((ps) => ({
                id: ps.service.id,
                name: ps.service.name,
                duration: ps.service.duration,
                price: ps.price || ps.service.price,
                description: ps.description || ps.service.description
            }))
        }));
        // Services
        services = yield serviceRepository_1.serviceRepository.findWithProfessionals();
        services = services.map((service) => ({
            id: service.id,
            name: service.name,
            duration: service.duration,
            price: service.price,
            category: service.category ? { id: service.category.id, name: service.category.name } : undefined,
            professionals: (service.professionals || []).map((ps) => ({
                id: ps.professional.id,
                name: ps.professional.name
            }))
        }));
        // Companies
        const companyFilters = {};
        if (q)
            companyFilters.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } }
            ];
        if (category)
            companyFilters.categories = { has: category };
        try {
            const result = yield companyRepository_1.default.findAll(pageNum, limitNum);
            companies = result.companies.map((company) => ({
                id: company.id,
                name: company.name,
                description: company.description,
                categories: company.categories,
                address: company.address ? {
                    street: company.address.street,
                    city: company.address.city,
                    state: company.address.state
                } : undefined
            }));
        }
        catch (error) {
            companies = [];
        }
        res.json({ professionals, services, companies });
    }
    catch (error) {
        res.status(500).json({ message: 'An error occurred while searching' });
    }
})));
exports.default = router;
