import { Router } from "express";
import { getAllCategories } from "../controllers/categoryController";
// import { authMiddleware } from "../middlewares/authMiddleware"; // Decide if categories need auth

const router = Router();

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
router.get("/", getAllCategories);

// Potentially add routes for creating/updating/deleting categories later if needed
// router.post("/", createCategoryValidator, validateRequest, createCategory);
// router.put("/:id", updateCategoryValidator, validateRequest, updateCategory);
// router.delete("/:id", categoryIdValidator, validateRequest, deleteCategory);

export default router;

