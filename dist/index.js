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
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes"));
const professionalRoutes_1 = __importDefault(require("./routes/professionalRoutes")); // Descomentado
const appointmentRoutes_1 = __importDefault(require("./routes/appointmentRoutes")); // Descomentado
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes")); // Descomentado
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Added for user profile
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes")); // Added for categories
const swagger_1 = require("./swagger");
const app = (0, express_1.default)();
<<<<<<< HEAD
const port = process.env.PORT || 3002; // Porta para o backend
app.use((0, cors_1.default)()); // Habilita CORS para permitir requisições do frontend
app.use(express_1.default.json()); // Middleware para parsear JSON
=======
exports.app = app;
const port = process.env.PORT || 3001;
// Middlewares de Segurança e Configuração
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
>>>>>>> ebe96a03c7f68bd0dd0bd8752dffc44159043a42
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
app.use('/api/professionals', professionalRoutes_1.default); // Descomentado
app.use('/api/appointments', appointmentRoutes_1.default); // Descomentado
app.use('/api/reviews', reviewRoutes_1.default); // Descomentado
app.use('/api/users', userRoutes_1.default); // Added for user profile
app.use('/api/categories', categoryRoutes_1.default); // Added for categories// TODO: Implementar um middleware de tratamento de erros global
// Iniciar o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
    app.listen(Number(port), '0.0.0.0', () => {
        console.log(`[server]: Servidor rodando em http://localhost:${port}`);
        console.log(`[swagger]: Documentação da API disponível em http://localhost:${port}/api-docs`);
    });
}
