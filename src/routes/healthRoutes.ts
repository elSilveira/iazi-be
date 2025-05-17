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
  let retryCount = 0;
  const maxRetries = 3;
  
  // Function to test the database connection with retries
  const testDbConnection = async () => {
    while (retryCount < maxRetries) {
      try {
        // Simple database query to check connectivity
        await prisma.$queryRaw`SELECT 1 as result`;
        dbConnected = true;
        return;
      } catch (error) {
        retryCount++;
        console.error(`[health]: Database connectivity check failed (attempt ${retryCount}/${maxRetries}):`, error);
        dbError = error instanceof Error ? error.message : 'Unknown database error';
        
        // If we have more retries to go, wait before trying again
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
        }
      }
    }
  };
  
  try {
    await testDbConnection();
  } catch (error) {
    console.error('[health]: Database connectivity check completely failed:', error);
  }
  
  // Get memory usage for diagnostics
  const memoryUsage = process.memoryUsage();
  
  // For Railway, always return 200 from the health check if the app is running
  // This ensures Railway doesn't cycle the container while we're debugging DB connectivity
  const statusCode = 200;
  
  res.status(statusCode).json({
    status: dbConnected ? 'ok' : 'limited',
    appStatus: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    dbConnected,
    dbError,
    dbRetries: retryCount,
    memoryUsage: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',  
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB'
    },
    port: process.env.PORT || 3002,
    hostname: require('os').hostname(),
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    envVars: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set'
    }
  });
});

export default router;
