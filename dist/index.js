"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet")); // Importa o Helmet
const express_rate_limit_1 = __importDefault(require("express-rate-limit")); // Importa express-rate-limit
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes"));
const professionalRoutes_1 = __importDefault(require("./routes/professionalRoutes"));
const appointmentRoutes_1 = __importDefault(require("./routes/appointmentRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes")); // Added notification routes
const gamificationRoutes_1 = __importDefault(require("./routes/gamificationRoutes")); // Added gamification routes
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes")); // Using the search routes with multi-service support
const swagger_1 = require("./swagger");
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 3003;
// Confia no primeiro proxy
app.set('trust proxy', 1);
// --- Rate Limiting Configuration ---
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register requests per windowMs
    message: 'Muitas tentativas de autenticação a partir deste IP, tente novamente após 15 minutos',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const appointmentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 appointment creation requests per windowMs
    message: 'Muitas tentativas de criação de agendamento a partir deste IP, tente novamente após 1 hora',
    standardHeaders: true,
    legacyHeaders: false,
});
// --- End Rate Limiting ---
// Middlewares de Segurança e Configuração
app.use((0, helmet_1.default)());
// Configuração CORS mais restrita para produção
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || '*' : '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Se precisar enviar cookies/authorization headers
    optionsSuccessStatus: 204
};
app.use((0, cors_1.default)(corsOptions));
// Apply rate limiting before JSON parsing if possible, or early in middleware chain
// Apply authLimiter specifically to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
// *** Aumentar limite do payload para JSON e URL-encoded ***
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Configuração do Swagger
(0, swagger_1.setupSwagger)(app);
// Rota de teste inicial
app.get('/', (req, res) => {
    res.send('Servidor Backend ServiConnect está rodando!');
});
// Rotas da API
app.use('/api/auth', authRoutes_1.default);
app.use('/api/services', serviceRoutes_1.default);
app.use('/api/companies', companyRoutes_1.default);
app.use('/api/professionals', professionalRoutes_1.default);
app.use('/api/appointments', appointmentRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/gamification', gamificationRoutes_1.default);
app.use('/api/search', searchRoutes_1.default);
const errorMiddleware_1 = require("./middlewares/errorMiddleware"); // Importar o middleware de erro
app.use(errorMiddleware_1.errorMiddleware); // Usar o middleware de erro global
// Iniciar o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
    app.listen(Number(port), '0.0.0.0', () => {
        console.log(`[server]: Servidor rodando em http://localhost:${port}`);
        console.log(`[swagger]: Documentação da API disponível em http://localhost:${port}/api-docs`);
    });
}
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const likeRoutes_1 = __importDefault(require("./routes/likeRoutes"));
// Rotas Sociais
app.use("/api/posts", postRoutes_1.default);
app.use("/api", likeRoutes_1.default);
