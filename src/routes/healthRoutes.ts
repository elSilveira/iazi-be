// src/routes/healthRoutes.ts
import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: ['Health']
 *     summary: Verifica a saúde da aplicação
 *     description: Endpoint para verificar se a aplicação está funcionando corretamente
 *     responses:
 *       200:
 *         description: Aplicação está saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-05-16T12:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 environment:
 *                   type: string
 *                   example: "production"
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
