import * as dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Importa o Helmet
import authRouter from './routes/authRoutes';
import serviceRouter from './routes/serviceRoutes';
import companyRouter from './routes/companyRoutes';
import professionalRouter from './routes/professionalRoutes'; // Descomentado
import appointmentRouter from './routes/appointmentRoutes'; // Descomentado
import reviewRouter from './routes/reviewRoutes'; // Descomentado
import userAddressRouter from './routes/userAddressRoutes'; // Added for user addresses
import companyAddressRouter from './routes/companyAddressRoutes'; // Added for company addresses
import userRouter from './routes/userRoutes'; // Added for user profile
import categoryRouter from './routes/categoryRoutes'; // Added for categories
import { setupSwagger } from './swagger';

const app: Express = express();
const port = process.env.PORT || 3002;

// Middlewares de Segurança e Configuração
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuração do Swagger
setupSwagger(app);

// Rota de teste inicial
app.get('/', (req: Request, res: Response) => {
  res.send('Servidor Backend ServiConnect está rodando!');
});

// Rotas da API
app.use('/api/auth', authRouter);
app.use('/api/services', serviceRouter);
app.use('/api/companies', companyRouter);
app.use('/api/professionals', professionalRouter); // Descomentado
app.use('/api/appointments', appointmentRouter); // Descomentado
app.use('/api/reviews', reviewRouter); // Descomentado
app.use('/api/users', userRouter); // Added for user profile
app.use('/api/categories', categoryRouter); // Added for categories// TODO: Implementar um middleware de tratamento de erros global
// app.use(globalErrorHandler);

// Exportar o app para uso em testes de integração
export { app };

// Iniciar o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[server]: Servidor rodando em http://localhost:${port}`);
    console.log(`[swagger]: Documentação da API disponível em http://localhost:${port}/api-docs`);
  });
}

