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
                        bio: { type: 'string', nullable: true, description: 'Biografia do usuário' },
                        phone: { type: 'string', nullable: true, description: 'Telefone do usuário' },
                        role: { $ref: '#/components/schemas/UserRole' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
                },
                UserAddress: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do endereço do usuário (UUID)' },
                        street: { type: 'string', description: 'Rua' },
                        number: { type: 'string', description: 'Número' },
                        complement: { type: 'string', nullable: true, description: 'Complemento' },
                        neighborhood: { type: 'string', description: 'Bairro' },
                        city: { type: 'string', description: 'Cidade' },
                        state: { type: 'string', description: 'Estado (UF)' },
                        zipCode: { type: 'string', description: 'CEP' },
                        isPrimary: { type: 'boolean', default: false, description: 'Indica se é o endereço principal do usuário' },
                        userId: { type: 'string', format: 'uuid', description: 'ID do usuário associado' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode', 'isPrimary', 'userId', 'createdAt', 'updatedAt'],
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
                        address: { $ref: '#/components/schemas/CompanyAddress', nullable: true }, // Corrected ref
                        workingHours: { type: 'object', nullable: true, description: 'Horário de funcionamento (JSON)' },
                        categories: { type: 'array', items: { type: 'string' }, description: 'Categorias de serviço da empresa' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'name', 'description', 'rating', 'totalReviews', 'categories', 'createdAt', 'updatedAt'],
                },
                CompanyAddress: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do endereço da empresa (UUID)' },
                        street: { type: 'string', description: 'Rua' },
                        number: { type: 'string', description: 'Número' },
                        complement: { type: 'string', nullable: true, description: 'Complemento' },
                        neighborhood: { type: 'string', description: 'Bairro' },
                        city: { type: 'string', description: 'Cidade' },
                        state: { type: 'string', description: 'Estado (UF)' },
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
                        categoryId: { type: 'integer', description: 'ID da categoria do serviço' },
                        image: { type: 'string', format: 'url', nullable: true, description: 'URL da imagem do serviço' },
                        companyId: { type: 'string', format: 'uuid', description: 'ID da empresa que oferece o serviço' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'name', 'description', 'price', 'duration', 'categoryId', 'companyId', 'createdAt', 'updatedAt'],
                },
                Professional: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único do profissional (UUID)' },
                        name: { type: 'string', description: 'Nome do profissional' },
                        role: { type: 'string', description: 'Cargo ou função do profissional' },
                        image: { type: 'string', format: 'url', nullable: true, description: 'URL da foto do profissional' },
                        rating: { type: 'number', format: 'float', default: 0, description: 'Avaliação média do profissional' },
                        totalReviews: { type: 'integer', default: 0, description: 'Número total de avaliações' }, // Added totalReviews
                        companyId: { type: 'string', format: 'uuid', description: 'ID da empresa associada' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                    },
                    required: ['id', 'name', 'role', 'rating', 'totalReviews', 'companyId', 'createdAt', 'updatedAt'],
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
                ProfessionalServiceWithJoinFields: {
                    type: 'object',
                    description: 'Serviço vinculado a um profissional, incluindo campos do join (preço, descrição, agenda)',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID do serviço' },
                        name: { type: 'string', description: 'Nome do serviço' },
                        description: { type: 'string', description: 'Descrição do serviço' },
                        price: { type: 'string', nullable: true, description: 'Preço específico deste profissional para este serviço (opcional)' },
                        schedule: { type: 'array', items: { type: 'object' }, nullable: true, description: 'Agenda estruturada (JSON)' },
                        duration: { type: 'string', description: 'Duração do serviço (ex: "45min")' },
                        categoryId: { type: 'integer', description: 'ID da categoria do serviço' },
                        image: { type: 'string', format: 'url', nullable: true, description: 'URL da imagem do serviço' },
                        companyId: { type: 'string', format: 'uuid', description: 'ID da empresa que oferece o serviço' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Data da última atualização' },
                        professionalId: { type: 'string', format: 'uuid', description: 'ID do profissional' },
                        professionalServiceDescription: { type: 'string', nullable: true, description: 'Descrição do vínculo profissional-serviço' },
                    },
                    required: ['id', 'name', 'description', 'duration', 'categoryId', 'companyId', 'createdAt', 'updatedAt', 'professionalId'],
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
                UserRole: {
                    type: 'string',
                    enum: ['USER', 'ADMIN'], // Add other roles if needed
                    description: 'Papel do usuário no sistema',
                },
                // --- Schemas para Requisições (Inputs) ---
                CreateUserAddressInput: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        number: { type: 'string' },
                        complement: { type: 'string', nullable: true },
                        neighborhood: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string', minLength: 2, maxLength: 2 },
                        zipCode: { type: 'string' },
                        isPrimary: { type: 'boolean', default: false },
                    },
                    required: ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode'],
                },
                UpdateUserAddressInput: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        number: { type: 'string' },
                        complement: { type: 'string', nullable: true },
                        neighborhood: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string', minLength: 2, maxLength: 2 },
                        zipCode: { type: 'string' },
                        isPrimary: { type: 'boolean' },
                    },
                    // All fields are optional for update
                },
                UpsertCompanyAddressInput: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        number: { type: 'string' },
                        complement: { type: 'string', nullable: true },
                        neighborhood: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string', minLength: 2, maxLength: 2 },
                        zipCode: { type: 'string' },
                    },
                    required: ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode'],
                },
                CreateCompanyInput: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        email: { type: 'string', format: 'email', nullable: true },
                        phone: { type: 'string', nullable: true },
                        categories: { type: 'array', items: { type: 'string' } },
                        yearEstablished: { type: 'string', nullable: true },
                        address: { $ref: '#/components/schemas/UpsertCompanyAddressInput', nullable: true }, // Use input schema
                    },
                    required: ['name', 'description', 'categories'],
                },
                ProfessionalCreateInput: {
                    type: 'object',
                    required: [
                        'name', 'role', 'image', 'bio', 'phone', 'companyId',
                        'experiences', 'educations', 'services', 'availability', 'portfolioItems'
                    ],
                    properties: {
                        name: { type: 'string', description: 'Nome do profissional' },
                        role: { type: 'string', description: 'Cargo ou função do profissional' },
                        image: { type: 'string', description: 'URL do avatar/foto' },
                        bio: { type: 'string', description: 'Biografia' },
                        phone: { type: 'string', description: 'Telefone' },
                        companyId: { type: 'string', format: 'uuid', description: 'ID da empresa associada' },
                        experiences: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['title', 'companyName', 'startDate', 'endDate', 'description'],
                                properties: {
                                    title: { type: 'string' },
                                    companyName: { type: 'string' },
                                    startDate: { type: 'string', description: 'YYYY-MM ou YYYY-MM-DD' },
                                    endDate: { type: 'string', description: 'YYYY-MM ou YYYY-MM-DD' },
                                    description: { type: 'string' }
                                }
                            }
                        },
                        educations: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['institutionName', 'degree', 'fieldOfStudy', 'startDate', 'endDate', 'description'],
                                properties: {
                                    institutionName: { type: 'string' },
                                    degree: { type: 'string' },
                                    fieldOfStudy: { type: 'string' },
                                    startDate: { type: 'string', description: 'YYYY-MM ou YYYY-MM-DD' },
                                    endDate: { type: 'string', description: 'YYYY-MM ou YYYY-MM-DD' },
                                    description: { type: 'string' }
                                }
                            }
                        },
                        services: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['serviceId', 'price'],
                                properties: {
                                    serviceId: { type: 'string', format: 'uuid' },
                                    price: { type: 'number' }
                                }
                            }
                        },
                        availability: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['day_of_week', 'start_time', 'end_time'],
                                properties: {
                                    day_of_week: { type: 'string', enum: [
                                            'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
                                        ] },
                                    start_time: { type: 'string', description: 'HH:mm' },
                                    end_time: { type: 'string', description: 'HH:mm' }
                                }
                            }
                        },
                        portfolioItems: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['imageUrl', 'description'],
                                properties: {
                                    imageUrl: { type: 'string', description: 'URL da imagem' },
                                    description: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                ProfessionalUpdateInput: { $ref: '#/components/schemas/ProfessionalCreateInput' },
                ProfessionalListResponse: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Professional' }
                        },
                        total: { type: 'integer', description: 'Total de profissionais encontrados' },
                        page: { type: 'integer', description: 'Página atual' },
                        limit: { type: 'integer', description: 'Limite de itens por página' }
                    },
                    required: ['data', 'total', 'page', 'limit']
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
                bearerAuth: [], // Aplica a autenticação Bearer globalmente (pode ser definido por rota)
            },
        ],
        // Explicitly define paths for better control
        paths: {
            // --- User Address Paths ---
            '/api/users/me/addresses': {
                get: {
                    tags: ['User Addresses'],
                    summary: 'Lista os endereços do usuário autenticado',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        '200': {
                            description: 'Lista de endereços do usuário',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/UserAddress' }
                                    }
                                }
                            }
                        },
                        '401': { description: 'Não autorizado' }
                    }
                },
                post: {
                    tags: ['User Addresses'],
                    summary: 'Cria um novo endereço para o usuário autenticado',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateUserAddressInput' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Endereço criado com sucesso',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/UserAddress' }
                                }
                            }
                        },
                        '400': { description: 'Dados inválidos' },
                        '401': { description: 'Não autorizado' }
                    }
                }
            },
            '/api/users/me/addresses/{addressId}': {
                get: {
                    tags: ['User Addresses'],
                    summary: 'Obtém um endereço específico do usuário autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'addressId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Detalhes do endereço',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/UserAddress' }
                                }
                            }
                        },
                        '401': { description: 'Não autorizado' },
                        '404': { description: 'Endereço não encontrado' }
                    }
                },
                put: {
                    tags: ['User Addresses'],
                    summary: 'Atualiza um endereço específico do usuário autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'addressId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateUserAddressInput' }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Endereço atualizado com sucesso',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/UserAddress' }
                                }
                            }
                        },
                        '400': { description: 'Dados inválidos' },
                        '401': { description: 'Não autorizado' },
                        '404': { description: 'Endereço não encontrado' }
                    }
                },
                delete: {
                    tags: ['User Addresses'],
                    summary: 'Deleta um endereço específico do usuário autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'addressId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                    ],
                    responses: {
                        '204': { description: 'Endereço deletado com sucesso' },
                        '401': { description: 'Não autorizado' },
                        '404': { description: 'Endereço não encontrado' }
                    }
                }
            },
            // --- Company Address Paths ---
            '/api/companies/{companyId}/address': {
                get: {
                    tags: ['Company Addresses'],
                    summary: 'Obtém o endereço de uma empresa específica',
                    // security: [], // Assuming public access for GET
                    parameters: [
                        { name: 'companyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Detalhes do endereço da empresa',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CompanyAddress' }
                                }
                            }
                        },
                        '404': { description: 'Endereço da empresa não encontrado' }
                    }
                },
                put: {
                    tags: ['Company Addresses'],
                    summary: 'Cria ou atualiza o endereço de uma empresa específica',
                    security: [{ bearerAuth: [] }], // Requires authentication
                    parameters: [
                        { name: 'companyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpsertCompanyAddressInput' }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Endereço da empresa criado/atualizado com sucesso',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CompanyAddress' }
                                }
                            }
                        },
                        '400': { description: 'Dados inválidos' },
                        '401': { description: 'Não autorizado' },
                        '403': { description: 'Permissão negada' }, // Added for permission check
                        '404': { description: 'Empresa não encontrada' }
                    }
                }
                // DELETE for company address might not be needed if it's required
            },
            // --- Include other paths defined via JSDoc in routes/*.ts ---
        }
    },
    apis: ['./src/routes/*.ts'], // Still use this to pick up JSDoc from other routes
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    console.log(`[swagger]: Documentação da API disponível em /api-docs`);
    console.log(`[swagger]: Documentação da API disponível em http://localhost:3002/api-docs`); // Log the full URL
};
exports.setupSwagger = setupSwagger;
