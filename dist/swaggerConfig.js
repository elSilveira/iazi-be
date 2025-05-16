"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
// Define types based on Prisma models if needed for DTOs, or rely on Swagger definitions
// Example: Define a type for the CreateUserAddressDto if not using inline schema
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "ServiConnect API",
            version: "1.0.0",
            description: "API para a plataforma ServiConnect, conectando clientes a prestadores de serviço.",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3003}`, // Use PORT from .env or default
                description: "Servidor de Desenvolvimento",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter JWT token in the format: Bearer <token>"
                },
            },
            schemas: {
                // --- User Address Schemas ---
                UserAddress: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid", description: "Address ID" },
                        street: { type: "string" },
                        number: { type: "string" },
                        complement: { type: "string", nullable: true },
                        neighborhood: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zipCode: { type: "string", description: "Brazilian ZIP code" },
                        isPrimary: { type: "boolean", description: "Indicates if it's the primary address" },
                        userId: { type: "string", format: "uuid", description: "User ID associated with the address" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                CreateUserAddressDto: {
                    type: "object",
                    required: ["street", "number", "neighborhood", "city", "state", "zipCode"],
                    properties: {
                        street: { type: "string" },
                        number: { type: "string" },
                        complement: { type: "string", nullable: true },
                        neighborhood: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zipCode: { type: "string", description: "Valid Brazilian ZIP code" },
                        isPrimary: { type: "boolean", default: false },
                    },
                },
                UpdateUserAddressDto: {
                    type: "object",
                    properties: {
                        street: { type: "string" },
                        number: { type: "string" },
                        complement: { type: "string", nullable: true },
                        neighborhood: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zipCode: { type: "string", description: "Valid Brazilian ZIP code" },
                        isPrimary: { type: "boolean" },
                    },
                },
                // --- Error Schemas ---
                ErrorResponse: {
                    type: "object",
                    properties: {
                        message: { type: "string", description: "Error message" },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    value: { type: "string" },
                                    msg: { type: "string" },
                                    path: { type: "string" },
                                    location: { type: "string" }
                                }
                            },
                            description: "Validation errors (optional)"
                        }
                    }
                }
                // TODO: Add schemas for other models (ProfessionalExperience, ProfessionalEducation, etc.) as they are implemented
            },
        },
        security: [
            {
                bearerAuth: [], // Apply bearerAuth globally by default (can be overridden per operation)
            },
        ],
    },
    // Path to the API docs
    apis: ["./src/routes/*.ts"], // Point to route files where annotations are written
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
