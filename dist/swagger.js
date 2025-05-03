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
                url: 'http://localhost:3002', // Ajuste a URL base conforme necessário
                description: 'Servidor de Desenvolvimento',
            },
        ],
        components: {
            schemas: {
                // --- Modelos Principais ---
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do usuário (UUID)' },
                        email: { type: 'string', format: 'email', description: 'Email único do usuário' },
                        name: { type: 'string', description: 'Nome do usuário' },
                        avatar: { type: 'string', format: 'url', nullable: true, description: 'URL do avatar do usuário' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
                },
                Company: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único da empresa (UUID)' },
                        name: { type: 'string', description: 'Nome da empresa' },
                        description: { type: 'string', description: 'Descrição da empresa' },
                        logo: { type: 'string', format: 'url', nullable: true, description: 'URL do logo da empresa' },
                        coverImage: { type: 'string', format: 'url', nullable: true, description: 'URL da imagem de capa' },
                        rating: { type: 'number', format: 'float', default: 0, description: 'Avaliação média da empresa' },
                        totalReviews: { type: 'integer', default: 0, description: 'Número total de avaliações' },
                        yearEstablished: { type: 'string', nullable: true, description: 'Ano de fundação' },
                        phone: { type: 'string', nullable: true, description: 'Telefone da empresa' },
                        email: { type: 'string', format: 'email', nullable: true, description: 'Email da empresa' },
                        address: { $ref: '#/components/schemas/Address', nullable: true },
                        workingHours: { type: 'object', nullable: true, description: 'Horário de funcionamento (JSON)' },
                        categories: { type: 'array', items: { type: 'string' }, description: 'Categorias de serviço da empresa' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'name', 'description', 'rating', 'totalReviews', 'categories', 'createdAt', 'updatedAt'],
                },
                Address: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do endereço (UUID)' },
                        street: { type: 'string', description: 'Rua' },
                        number: { type: 'string', description: 'Número' },
                        complement: { type: 'string', nullable: true, description: 'Complemento' },
                        neighborhood: { type: 'string', description: 'Bairro' },
                        city: { type: 'string', description: 'Cidade' },
                        state: { type: 'string', description: 'Estado' },
                        zipCode: { type: 'string', description: 'CEP' },
                        companyId: { type: 'string', format: 'uuid', description: 'ID da empresa associada' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode', 'companyId', 'createdAt', 'updatedAt'],
                },
                Service: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do serviço (UUID)' },
                        name: { type: 'string', description: 'Nome do serviço' },
                        description: { type: 'string', description: 'Descrição do serviço' },
                        price: { type: 'string', description: 'Preço do serviço' },
                        duration: { type: 'string', description: 'Duração do serviço (ex: "45min")' },
                        category: { type: 'string', description: 'Categoria do serviço' },
                        image: { type: 'string', format: 'url', nullable: true, description: 'URL da imagem do serviço' },
                        companyId: { type: 'string', format: 'uuid', description: 'ID da empresa que oferece o serviço' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'name', 'description', 'price', 'duration', 'category', 'companyId', 'createdAt', 'updatedAt'],
                },
                Professional: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do profissional (UUID)' },
                        name: { type: 'string', description: 'Nome do profissional' },
                        role: { type: 'string', description: 'Cargo ou função do profissional' },
                        image: { type: 'string', format: 'url', nullable: true, description: 'URL da foto do profissional' },
                        rating: { type: 'number', format: 'float', default: 0, description: 'Avaliação média do profissional' },
                        appointments: { type: 'integer', default: 0, description: 'Contador (pode ser removido/revisado, parece não ser usado)' }, // Revisar este campo
                        companyId: { type: 'string', format: 'uuid', description: 'ID da empresa associada' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'name', 'role', 'rating', 'companyId', 'createdAt', 'updatedAt'],
                },
                ProfessionalService: {
                    type: 'object',
                    description: 'Relacionamento entre Profissional e Serviço, indicando qual profissional realiza qual serviço e um preço opcional específico.',
                    properties: {
                        professionalId: { type: 'string', format: 'uuid', description: 'ID do profissional' },
                        serviceId: { type: 'string', format: 'uuid', description: 'ID do serviço' },
                        price: { type: 'string', nullable: true, description: 'Preço específico deste profissional para este serviço (opcional)' },
                    },
                    required: ['professionalId', 'serviceId'],
                },
                Appointment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do agendamento (UUID)' },
                        date: { type: 'string', format: 'date-time', description: 'Data e hora do agendamento' },
                        status: { $ref: '#/components/schemas/AppointmentStatus' },
                        userId: { type: 'string', format: 'uuid', description: 'ID do usuário que agendou' },
                        serviceId: { type: 'string', format: 'uuid', description: 'ID do serviço agendado' },
                        professionalId: { type: 'string', format: 'uuid', nullable: true, description: 'ID do profissional responsável (pode ser nulo se excluído)' },
                        notes: { type: 'string', nullable: true, description: 'Observações adicionais' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'date', 'status', 'userId', 'serviceId', 'createdAt', 'updatedAt'],
                },
                Review: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único da avaliação (UUID)' },
                        rating: { type: 'number', format: 'float', minimum: 1, maximum: 5, description: 'Nota da avaliação (1 a 5)' },
                        comment: { type: 'string', nullable: true, description: 'Comentário da avaliação' },
                        userId: { type: 'string', format: 'uuid', description: 'ID do usuário que fez a avaliação' },
                        serviceId: { type: 'string', format: 'uuid', nullable: true, description: 'ID do serviço avaliado (opcional)' },
                        professionalId: { type: 'string', format: 'uuid', nullable: true, description: 'ID do profissional avaliado (opcional)' },
                        companyId: { type: 'string', format: 'uuid', nullable: true, description: 'ID da empresa avaliada (opcional)' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'rating', 'userId', 'createdAt', 'updatedAt'],
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'ID único da categoria' },
                        name: { type: 'string', description: 'Nome da categoria' },
                        icon: { type: 'string', nullable: true, description: 'Nome do ícone associado (ex: "brush", "wrench")' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'name', 'createdAt', 'updatedAt'],
                },
                // --- Enumerações ---
                AppointmentStatus: {
                    type: 'string',
                    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
                    description: 'Status do agendamento',
                },
                // --- Schemas para Requisições (Inputs) ---
                CreateCompanyInput: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        email: { type: 'string', format: 'email', nullable: true },
                        phone: { type: 'string', nullable: true },
                        categories: { type: 'array', items: { type: 'string' } },
                        yearEstablished: { type: 'string', nullable: true },
                        address: { $ref: '#/components/schemas/CreateAddressInput', nullable: true },
                    },
                    required: ['name', 'description', 'categories'],
                },
                CreateAddressInput: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        number: { type: 'string' },
                        complement: { type: 'string', nullable: true },
                        neighborhood: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string' },
                        zipCode: { type: 'string' },
                    },
                    required: ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode'],
                },
                // ... outros inputs ...
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Autenticação JWT. Use o token obtido no login no cabeçalho `Authorization: Bearer <token>`',
                },
            },
        },
        security: [
            {
                bearerAuth: [], // Aplica a autenticação Bearer globalmente (opcional, pode ser definido por rota)
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Only include routes, controllers are not needed here
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    console.log(`[swagger]: Documentação da API disponível em /api-docs`);
    console.log(`[swagger]: Documentação da API disponível em http://localhost:3001/api-docs`); // Log the full URL
};
exports.setupSwagger = setupSwagger;
