"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
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
                url: "http://localhost:3000", // TODO: Ajustar para URL de produção quando aplicável
                description: "Servidor de Desenvolvimento",
            },
        ],
        // TODO: Adicionar componentes como schemas de segurança (JWT) se necessário
        // components: {
        //   securitySchemes: {
        //     bearerAuth: {
        //       type: "http",
        //       scheme: "bearer",
        //       bearerFormat: "JWT",
        //     },
        //   },
        // },
        // security: [
        //   {
        //     bearerAuth: [],
        //   },
        // ],
    },
    // Caminho para os arquivos que contêm as anotações da API (rotas)
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Incluir controllers se as definições de schema estiverem lá
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
