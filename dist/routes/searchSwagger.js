"use strict";
/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search API for professionals, services, and companies
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Professional:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Professional unique identifier
 *         name:
 *           type: string
 *           description: Professional's full name
 *         role:
 *           type: string
 *           description: Professional's role or specialization
 *         bio:
 *           type: string
 *           description: Professional's biography or description
 *         rating:
 *           type: number
 *           format: float
 *           description: Average rating (0-5)
 *         avatar:
 *           type: string
 *           description: URL to profile image
 *         services:
 *           type: array
 *           description: Services offered by this professional
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Service ID
 *               name:
 *                 type: string
 *                 description: Service name
 *               duration:
 *                 type: string
 *                 description: Service duration in ISO 8601 format (e.g., PT1H30M)
 *               price:
 *                 type: number
 *                 description: Price for this professional's service
 *               description:
 *                 type: string
 *                 description: Service description specific to this professional
 */
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: General search for professionals, services and companies (with relationships)
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term to filter results by name, role, description, etc.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Categoria para filtrar resultados
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Critério de ordenação (rating, name)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, professionals, services, companies]
 *         description: Tipo de entidade para buscar (all = tudo, professionals = apenas profissionais com serviços, services = apenas serviços com profissionais, companies = empresas com serviços)
 *       - in: query
 *         name: professionalTipo
 *         schema:
 *           type: string
 *         description: Tipo de profissional para filtrar
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       rating:
 *                         type: number
 *                         format: float
 *                       image:
 *                         type: string
 *                       services:
 *                         type: array
 *                         description: Lista de serviços oferecidos pelo profissional
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                             duration:
 *                               type: string
 *                             price:
 *                               type: string
 *                             description:
 *                               type: string
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *                 companies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 */
