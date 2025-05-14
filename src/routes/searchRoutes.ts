import { Router } from "express";
import asyncHandler from "../utils/asyncHandler";
import { professionalRepository } from "../repositories/professionalRepository";
import { serviceRepository } from "../repositories/serviceRepository";
import companyRepository from "../repositories/companyRepository";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type, q, category, sort, page = "1", limit = "10", professionalTipo } = req.query;
    let professionals: any[] = [];
    let services: any[] = [];
    let companies: any[] = [];
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    let orderBy: any = { name: "asc" };
    if (sort === "rating") orderBy = { rating: "desc" };
    try {
      // Professionals
      const professionalFilters: any = {};
      if (q) professionalFilters.OR = [
        { name: { contains: q as string, mode: "insensitive" } },
        { role: { contains: q as string, mode: "insensitive" } }
      ];
      if (category) professionalFilters.services = {
        some: { service: { category: { name: { contains: category as string, mode: "insensitive" } } } }
      };
      // Only set role if professionalTipo is provided and not 'all'
      if (professionalTipo && professionalTipo !== 'all') {
        professionalFilters.role = { contains: professionalTipo as string, mode: "insensitive" };
      }
      professionals = await professionalRepository.findMany(
        professionalFilters, orderBy, skip, limitNum
      );
      professionals = professionals.map(prof => ({
        id: prof.id,
        name: prof.name,
        role: prof.role,
        rating: prof.rating,
        services: (prof.services || []).map((ps: any) => ({
          id: ps.service.id,
          name: ps.service.name,
          duration: ps.service.duration,
          price: ps.price || ps.service.price,
          description: ps.description || ps.service.description
        }))
      }));
      // Services
      services = await serviceRepository.findWithProfessionals();
      services = services.map((service: any) => ({
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
        category: service.category ? { id: service.category.id, name: service.category.name } : undefined,
        professionals: (service.professionals || []).map((ps: any) => ({
          id: ps.professional.id,
          name: ps.professional.name
        }))
      }));
      // Companies
      const companyFilters: any = {};
      if (q) companyFilters.OR = [
        { name: { contains: q as string, mode: "insensitive" } },
        { description: { contains: q as string, mode: "insensitive" } }
      ];
      if (category) companyFilters.categories = { has: category as string };
      try {
        const result = await companyRepository.findAll(pageNum, limitNum);
        companies = result.companies.map((company: any) => ({
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
      } catch (error) {
        companies = [];
      }
      res.json({ professionals, services, companies });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred while searching' });
    }
  })
);

export default router;
