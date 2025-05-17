// src/routes/healthRoutes.ts
import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../utils/prismaClient';

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
 *                 dbConnected:
 *                   type: boolean
 *                   example: true
 *                 memoryUsage:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                       example: 50000000
 *                     heapTotal:
 *                       type: number
 *                       example: 30000000
 *                     heapUsed:
 *                       type: number
 *                       example: 20000000
 */
router.get('/', async (req: Request, res: Response) => {
  let dbConnected = false;
  let dbError = null;
  
  try {
    // Test database connection - simple query that shouldn't fail
    await prisma.$queryRaw`SELECT 1 as result`;
    dbConnected = true;
  } catch (error) {
    console.error('[health]: Database connectivity check failed:', error);
    dbError = error instanceof Error ? error.message : 'Unknown database error';
  }
  
  // Get memory usage for diagnostics
  const memoryUsage = process.memoryUsage();
  
  // Determine overall status
  const isHealthy = dbConnected;
  const statusCode = isHealthy ? 200 : 503; // Return 503 Service Unavailable if not healthy
  
  res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    dbConnected,
    dbError,
    memoryUsage: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',  
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB'
    },
    port: process.env.PORT || 3002,
    hostname: require('os').hostname()
  });
});

export default router;
