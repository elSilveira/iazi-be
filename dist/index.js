"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes")); // Updated import
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes")); // Updated import
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes")); // Updated import
const swagger_1 = require("./swagger");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001; // Porta para o backend
app.use((0, cors_1.default)()); // Habilita CORS para permitir requisições do frontend
app.use(express_1.default.json()); // Middleware para parsear JSON
// Configuração do Swagger
(0, swagger_1.setupSwagger)(app);
// Rota de teste inicial
app.get('/', (req, res) => {
    res.send('Servidor Backend ServiConnect está rodando!');
});
// Rotas da API usando as factory functions
app.use('/api/auth', (0, authRoutes_1.default)());
app.use('/api/services', (0, serviceRoutes_1.default)());
app.use('/api/companies', (0, companyRoutes_1.default)());
app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[server]: Servidor rodando em http://localhost:${port}`);
    console.log(`[swagger]: Documentação da API disponível em http://localhost:${port}/api-docs`);
});
