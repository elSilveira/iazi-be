"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
// import { authMiddleware } from "../middlewares/authMiddleware"; // Decide if categories need auth
const router = (0, express_1.Router)();
// Optional: Apply auth middleware if only logged-in users can see categories
// router.use(authMiddleware);
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtém todas as categorias de serviço
 *     tags: [Categories]
 *     # security:
 *     #   - bearerAuth: [] # Descomente se a autenticação for necessária
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category' # Referencia o schema Category
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", categoryController_1.getAllCategories);
// Potentially add routes for creating/updating/deleting categories later if needed
// router.post("/", createCategoryValidator, validateRequest, createCategory);
// router.put("/:id", updateCategoryValidator, validateRequest, updateCategory);
// router.delete("/:id", categoryIdValidator, validateRequest, deleteCategory);
exports.default = router;
