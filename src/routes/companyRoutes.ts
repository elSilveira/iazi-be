import express, { Express, Request, Response, Router, RequestHandler } from 'express';
import { Company } from '../models/Company'; // Import the Company type

// Mock data based on frontend's mock-company.ts
const mockCompanyDb: Company[] = [
  {
    id: "123",
    name: "Barbearia Vintage",
    description: "Barbearia especializada em cortes modernos e tradicionais",
    logo: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=300",
    coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200",
    rating: 4.8,
    totalReviews: 156,
    categories: ["Barbearia", "Estética Masculina"],
    yearEstablished: "2020",
    address: {
      street: "Rua Augusta",
      number: "1000",
      complement: "Loja 2",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      zipCode: "01304-001"
    },
    phone: "(11) 98765-4321",
    email: "contato@barbeariavintage.com.br",
    workingHours: {
      monday: { open: "09:00", close: "20:00", isOpen: true },
      tuesday: { open: "09:00", close: "20:00", isOpen: true },
      wednesday: { open: "09:00", close: "20:00", isOpen: true },
      thursday: { open: "09:00", close: "20:00", isOpen: true },
      friday: { open: "09:00", close: "22:00", isOpen: true },
      saturday: { open: "09:00", close: "18:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: false }
    },
    services: [
      {
        id: "1",
        name: "Corte de Cabelo",
        description: "Corte moderno ou tradicional com acabamento perfeito",
        price: "R$ 60,00",
        duration: "45",
        category: "Cabelo"
      },
      {
        id: "2",
        name: "Barba",
        description: "Alinhamento e acabamento de barba com toalha quente",
        price: "R$ 45,00",
        duration: "30",
        category: "Barba"
      },
      {
        id: "3",
        name: "Combo Cabelo + Barba",
        description: "Corte de cabelo e barba com produtos premium",
        price: "R$ 95,00",
        duration: "75",
        category: "Combo"
      }
    ],
    staff: [
      {
        id: "1",
        name: "João Silva",
        role: "Barbeiro Senior",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
        rating: 4.9,
        appointments: 450
      },
      {
        id: "2",
        name: "Pedro Santos",
        role: "Barbeiro",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        rating: 4.7,
        appointments: 280
      },
      {
        id: "3",
        name: "Carlos Oliveira",
        role: "Barbeiro",
        image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
        rating: 4.8,
        appointments: 320
      }
    ]
  }
  // Add more mock companies if needed
];

// Alternativa para resolver o problema de tipagem
const createRouter = (): Router => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Empresas
   *   description: Endpoints para gerenciamento de empresas
   */

  /**
   * @swagger
   * /api/companies:
   *   get:
   *     summary: Retorna uma lista de todas as empresas
   *     tags: [Empresas]
   *     responses:
   *       200:
   *         description: Lista de empresas retornada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Company'
   */
  // Removido o tipo explícito RequestHandler
  const getAllCompaniesHandler = (req: Request, res: Response) => {
    res.json(mockCompanyDb); // Removido return
  };
  router.get('/', getAllCompaniesHandler);

  /**
   * @swagger
   * /api/companies/{id}:
   *   get:
   *     summary: Retorna uma empresa específica pelo ID
   *     tags: [Empresas]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: ID da empresa
   *     responses:
   *       200:
   *         description: Empresa retornada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Company'
   *       404:
   *         description: Empresa não encontrada
   */
  // Removido o tipo explícito RequestHandler
  const getCompanyByIdHandler = (req: Request, res: Response) => {
    const id = req.params.id;
    const company = mockCompanyDb.find((c) => c.id === id);
    if (company) {
      res.json(company); // Removido return
    } else {
      res.status(404).json({ message: 'Empresa não encontrada' }); // Removido return
    }
  };
  router.get('/:id', getCompanyByIdHandler);

  return router;
};

export default createRouter;
