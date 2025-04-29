import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
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

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

