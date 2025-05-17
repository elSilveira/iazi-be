import * as dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Importa o Helmet
import rateLimit from 'express-rate-limit'; // Importa express-rate-limit

import authRouter from './routes/authRoutes';
import serviceRouter from './routes/serviceRoutes';
import companyRouter from './routes/companyRoutes';
import professionalRouter from './routes/professionalRoutes';
import appointmentRouter from './routes/appointmentRoutes';
import reviewRouter from './routes/reviewRoutes';
import userAddressRouter from './routes/userAddressRoutes';
import companyAddressRouter from './routes/companyAddressRoutes';
import userRouter from './routes/userRoutes';
import categoryRouter from './routes/categoryRoutes';
import notificationRouter from './routes/notificationRoutes'; // Added notification routes
import gamificationRouter from './routes/gamificationRoutes'; // Added gamification routes
import searchRoutes from './routes/searchRoutes'; // Using the search routes with multi-service support
import healthRoutes from './routes/healthRoutes'; // Added health routes for monitoring
import postRoutes from './routes/postRoutes';
import commentRoutes from './routes/commentRoutes';
import likeRoutes from './routes/likeRoutes';

import { setupSwagger } from './swagger';

const app: Express = express();
const port = process.env.PORT || 3002;

// Confia no primeiro proxy
app.set('trust proxy', 1);

// --- Rate Limiting Configuration ---
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 login/register requests per windowMs
	message: 'Muitas tentativas de autenticação a partir deste IP, tente novamente após 15 minutos',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const appointmentLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 50, // Limit each IP to 50 appointment creation requests per windowMs
	message: 'Muitas tentativas de criação de agendamento a partir deste IP, tente novamente após 1 hora',
	standardHeaders: true,
	legacyHeaders: false,
});
// --- End Rate Limiting ---

// Middlewares de Segurança e Configuração
app.use(helmet());

// Configuração CORS mais restrita para produção
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || '*' : '*',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Se precisar enviar cookies/authorization headers
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Apply rate limiting before JSON parsing if possible, or early in middleware chain
// Apply authLimiter specifically to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// *** Aumentar limite do payload para JSON e URL-encoded ***
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
app.use('/api/professionals', professionalRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/search', searchRoutes);
app.use('/api/health', healthRoutes); // Rota de verificação de saúde para monitoramento

// Rotas Sociais
app.use("/api/posts", postRoutes); 
app.use("/api/comments", commentRoutes);
app.use("/api", likeRoutes);

import { errorMiddleware } from './middlewares/errorMiddleware'; // Importar o middleware de erro
app.use(errorMiddleware); // Usar o middleware de erro global

// Exportar o app para uso em testes de integração
export { app };

// Iniciar o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[server]: Servidor rodando em http://localhost:${port}`);
    console.log(`[swagger]: Documentação da API disponível em http://localhost:${port}/api-docs`);
  });
}
