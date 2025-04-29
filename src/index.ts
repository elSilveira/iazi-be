import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import createAuthRouter from './routes/authRoutes'; // Updated import
import createServiceRouter from './routes/serviceRoutes'; // Updated import
import createCompanyRouter from './routes/companyRoutes'; // Updated import
import { setupSwagger } from './swagger';

const app: Express = express();
const port = process.env.PORT || 3001; // Porta para o backend

app.use(cors()); // Habilita CORS para permitir requisições do frontend
app.use(express.json()); // Middleware para parsear JSON

// Configuração do Swagger
setupSwagger(app);

// Rota de teste inicial
app.get('/', (req: Request, res: Response) => {
  res.send('Servidor Backend ServiConnect está rodando!');
});

// Rotas da API usando as factory functions
app.use('/api/auth', createAuthRouter());
app.use('/api/services', createServiceRouter());
app.use('/api/companies', createCompanyRouter());

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Servidor rodando em http://localhost:${port}`);
  console.log(`[swagger]: Documentação da API disponível em http://localhost:${port}/api-docs`);
});
