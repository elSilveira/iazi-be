import { Router } from "express";
import asyncHandler from "../utils/asyncHandler";
import { professionalRepository } from "../repositories/professionalRepository";
import { serviceRepository } from "../repositories/serviceRepository";
import companyRepository from "../repositories/companyRepository";

const router = Router();

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
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type } = req.query;
    let professionals: any[] = [];
    let services: any[] = [];
    let companies: any[] = [];

    if (!type || type === "all" || type === "professionals") {
      professionals = await professionalRepository.findMany(
        { services: { some: {} } },
        { name: "asc" },
        0,
        1000
      );
    }
    if (!type || type === "all" || type === "services") {
      services = await serviceRepository.findWithProfessionals();
    }
    if (!type || type === "all" || type === "companies") {
      companies = await companyRepository.findMany(
        {},
        { name: "asc" },
        0,
        1000
      );
    }
    res.json({ professionals, services, companies });
  })
);

export default router;
