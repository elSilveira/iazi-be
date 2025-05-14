import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

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
        UserAddress: { // Added UserAddress Schema
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
        CompanyAddress: { // Renamed from Address
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
        AppointmentService: {
          type: 'object',
          properties: {
            appointmentId: { type: 'string', format: 'uuid', description: 'ID do agendamento' },
            serviceId: { type: 'string', format: 'uuid', description: 'ID do serviço' },
          },
          required: ['appointmentId', 'serviceId'],
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID único do agendamento (UUID)' },
            startTime: { type: 'string', format: 'date-time', description: 'Data e hora de início do agendamento' },
            endTime: { type: 'string', format: 'date-time', description: 'Data e hora de término do agendamento' },
            status: { $ref: '#/components/schemas/AppointmentStatus' },
            userId: { type: 'string', format: 'uuid', description: 'ID do usuário que agendou' },
            professionalId: { type: 'string', format: 'uuid', nullable: true, description: 'ID do profissional responsável (pode ser nulo se excluído)' },
            companyId: { type: 'string', format: 'uuid', nullable: true, description: 'ID da empresa (opcional)' },
            notes: { type: 'string', nullable: true, description: 'Observações adicionais' },
            services: {
              type: 'array',
              description: 'Serviços agendados (pode ser múltiplos)',
              items: {
                type: 'object',
                properties: {
                  service: { $ref: '#/components/schemas/Service' }
                }
              }
            },
            professional: { $ref: '#/components/schemas/Professional', nullable: true },
            company: { $ref: '#/components/schemas/Company', nullable: true },
            user: { $ref: '#/components/schemas/User', nullable: true },
          },
          required: ['id', 'startTime', 'endTime', 'status', 'userId', 'services'],
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
        CreateUserAddressInput: { // Added
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
        UpdateUserAddressInput: { // Added
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
        UpsertCompanyAddressInput: { // Added (used for PUT on company address)
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
        AppointmentCreateInput: {
          type: 'object',
          properties: {
            professionalId: { type: 'string', format: 'uuid', description: 'ID do profissional' },
            companyId: { type: 'string', format: 'uuid', nullable: true, description: 'ID da empresa (opcional)' },
            date: { type: 'string', format: 'date', description: 'Data do agendamento (YYYY-MM-DD)' },
            time: { type: 'string', description: 'Hora do agendamento (HH:mm)' },
            serviceIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              description: 'IDs dos serviços a serem agendados (mínimo 1)',
              minItems: 1
            },
            notes: { type: 'string', nullable: true, description: 'Observações adicionais' },
          },
          required: ['professionalId', 'date', 'time', 'serviceIds'],
        },
        // ... outros inputs ...
      },
      securitySchemes: {
        bearerAuth: { // Define o esquema de autenticação Bearer
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
      '/api/auth/invites': {
        post: {
          tags: ['Auth'],
          summary: 'Gera um novo código de convite (admin, profissional ou empresa)',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': {
              description: 'Código de convite gerado com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', description: 'Código de convite gerado' }
                    }
                  }
                }
              }
            },
            '403': { description: 'Apenas administradores, empresas ou profissionais podem gerar convites.' }
          }
        }
      },
      '/api/appointments': {
        post: {
          summary: 'Cria um novo agendamento (multi-serviço)',
          tags: ['Appointments'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AppointmentCreateInput' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Agendamento criado com sucesso.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Appointment' }
                }
              }
            },
            '400': { description: 'Erro de validação nos dados da requisição (ex: horário indisponível, dados inválidos).' },
            '401': { description: 'Não autorizado.' },
            '404': { description: 'Serviço, Profissional ou Empresa não encontrado(s).' },
            '409': { description: 'Horário indisponível.' },
            '500': { description: 'Erro interno do servidor.' }
          }
        },
        get: {
          summary: 'Lista os agendamentos do usuário autenticado (ou todos para Admin)',
          tags: ['Appointments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'status', schema: { $ref: '#/components/schemas/AppointmentStatus' }, description: 'Filtrar por status' },
            { in: 'query', name: 'professionalId', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por profissional' },
            { in: 'query', name: 'companyId', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por empresa' },
            { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date' }, description: 'Filtrar por data inicial (YYYY-MM-DD)' },
            { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date' }, description: 'Filtrar por data final (YYYY-MM-DD)' },
            { in: 'query', name: 'serviceId', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por serviço' },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Número da página' },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Número de itens por página' }
          ],
          responses: {
            '200': {
              description: 'Lista de agendamentos retornada com sucesso.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } },
                      meta: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          limit: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Parâmetros de filtro ou paginação inválidos.' },
            '401': { description: 'Não autorizado.' },
            '500': { description: 'Erro interno do servidor.' }
          }
        }
      },
      '/api/appointments/{id}': {
        get: {
          summary: 'Obtém um agendamento específico pelo ID',
          tags: ['Appointments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID do agendamento' }
          ],
          responses: {
            '200': {
              description: 'Detalhes do agendamento retornados com sucesso.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Appointment' }
                }
              }
            },
            '400': { description: 'ID inválido.' },
            '401': { description: 'Não autorizado.' },
            '403': { description: 'Acesso negado (usuário não tem permissão para ver este agendamento).' },
            '404': { description: 'Agendamento não encontrado.' },
            '500': { description: 'Erro interno do servidor.' }
          }
        }
      },
    }
  },
  apis: ['./src/routes/*.ts'], // Still use this to pick up JSDoc from other routes
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`[swagger]: Documentação da API disponível em /api-docs`);
  console.log(`[swagger]: Documentação da API disponível em http://localhost:3002/api-docs`); // Log the full URL
};

