import express, { Express, Request, Response, Router, RequestHandler } from 'express';
import { Service } from '../models/Service'; // Import the Service type

// Mock data based on frontend's mock-services.ts
const mockServicesDb: Service[] = [
  {
    id: 1,
    name: "Limpeza de Pele Profunda",
    category: "Tratamento Facial",
    company: "Clínica DermaBem",
    professional: "Dra. Ana Silva",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881",
    rating: 4.8,
    reviews: 87,
    price: "R$180",
    duration: "60 min",
    availability: "Hoje",
    company_id: "clinica-dermabem-123",
    professional_id: "dra-ana-silva-456",
    description: "Limpeza de pele completa com extração de cravos e espinhas, esfoliação e hidratação profunda para todos os tipos de pele.",
  },
  {
    id: 2,
    name: "Quiropraxia",
    category: "Fisioterapia",
    company: "FisioSaúde",
    professional: "Dr. Carlos Mendes",
    image: "https://images.unsplash.com/photo-1552693673-1bf958298935",
    rating: 4.9,
    reviews: 112,
    price: "R$150",
    duration: "45 min",
    availability: "Amanhã",
    company_id: "fisiosaude-789",
    professional_id: "dr-carlos-mendes-101",
    description: "Tratamento quiroprático para alinhamento da coluna, alívio de tensões musculares e melhora da postura corporal.",
  },
  // Add more mock services if needed based on mock-services.ts
];

// Alternativa para resolver o problema de tipagem
const createRouter = (): Router => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Serviços
   *   description: Endpoints para gerenciamento de serviços
   */

  /**
   * @swagger
   * /api/services:
   *   get:
   *     summary: Retorna uma lista de todos os serviços
   *     tags: [Serviços]
   *     responses:
   *       200:
   *         description: Lista de serviços retornada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Service'
   */
  // Removido o tipo explícito RequestHandler
  const getAllServicesHandler = (req: Request, res: Response) => {
    res.json(mockServicesDb); // Removido return
  };
  router.get('/', getAllServicesHandler);

  /**
   * @swagger
   * /api/services/{id}:
   *   get:
   *     summary: Retorna um serviço específico pelo ID
   *     tags: [Serviços]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: ID numérico do serviço
   *     responses:
   *       200:
   *         description: Serviço retornado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Service'
   *       404:
   *         description: Serviço não encontrado
   */
  // Removido o tipo explícito RequestHandler
  const getServiceByIdHandler = (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const service = mockServicesDb.find((s) => s.id === id);
    if (service) {
      res.json(service); // Removido return
    } else {
      res.status(404).json({ message: 'Serviço não encontrado' }); // Removido return
    }
  };
  router.get('/:id', getServiceByIdHandler);

  return router;
};

export default createRouter;
