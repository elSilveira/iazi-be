"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ServiConnect API',
            version: '1.0.0',
            description: 'API para o aplicativo ServiConnect, conectando usuários, profissionais e empresas de serviços.',
        },
        servers: [
            {
                url: 'http://localhost:3001', // Ajuste a URL base conforme necessário
                description: 'Servidor de Desenvolvimento',
            },
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'ID único do usuário' },
                        name: { type: 'string', description: 'Nome do usuário' },
                        email: { type: 'string', format: 'email', description: 'Email do usuário' },
                        avatar: { type: 'string', format: 'url', description: 'URL do avatar do usuário' },
                    },
                },
                Service: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'ID único do serviço' },
                        name: { type: 'string', description: 'Nome do serviço' },
                        category: { type: 'string', description: 'Categoria do serviço' },
                        company: { type: 'string', description: 'Nome da empresa que oferece o serviço' },
                        professional: { type: 'string', description: 'Nome do profissional que realiza o serviço' },
                        image: { type: 'string', format: 'url', description: 'URL da imagem do serviço' },
                        rating: { type: 'number', format: 'float', description: 'Avaliação média do serviço' },
                        reviews: { type: 'integer', description: 'Número de avaliações do serviço' },
                        price: { type: 'string', description: 'Preço do serviço' },
                        duration: { type: 'string', description: 'Duração do serviço' },
                        availability: { type: 'string', description: 'Disponibilidade do serviço' },
                        company_id: { type: 'string', description: 'ID da empresa' },
                        professional_id: { type: 'string', description: 'ID do profissional' },
                        description: { type: 'string', description: 'Descrição detalhada do serviço' },
                    },
                },
                Company: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'ID único da empresa' },
                        name: { type: 'string', description: 'Nome da empresa' },
                        description: { type: 'string', description: 'Descrição da empresa' },
                        logo: { type: 'string', format: 'url', description: 'URL do logo da empresa' },
                        coverImage: { type: 'string', format: 'url', description: 'URL da imagem de capa da empresa' },
                        rating: { type: 'number', format: 'float', description: 'Avaliação média da empresa' },
                        totalReviews: { type: 'integer', description: 'Número total de avaliações' },
                        categories: { type: 'array', items: { type: 'string' }, description: 'Categorias da empresa' },
                        yearEstablished: { type: 'string', description: 'Ano de fundação' },
                        address: {
                            type: 'object',
                            properties: { /* Definição do endereço */}
                        },
                        phone: { type: 'string', description: 'Telefone da empresa' },
                        email: { type: 'string', format: 'email', description: 'Email da empresa' },
                        workingHours: {
                            type: 'object',
                            properties: { /* Definição do horário de funcionamento */}
                        },
                        services: { type: 'array', items: { /* Definição do serviço da empresa */} },
                        staff: { type: 'array', items: { /* Definição do membro da equipe */} },
                    },
                },
                // Adicione aqui outros schemas conforme necessário
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [], // Aplica a autenticação Bearer globalmente (opcional)
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Caminho para os arquivos com anotações Swagger
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    console.log(`[swagger]: Documentação da API disponível em /api-docs`);
};
exports.setupSwagger = setupSwagger;
