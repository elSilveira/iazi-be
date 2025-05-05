import { Request, Response, NextFunction } from "express"; // Import NextFunction
import { reviewRepository } from "../repositories/reviewRepository";
import { prisma } from "../lib/prisma"; // Correctly import prisma client
import { Prisma, UserRole } from "@prisma/client"; // Import UserRole
import { gamificationService, GamificationEventType } from "../services/gamificationService"; // Import gamification service
import { logActivity } from "../services/activityLogService"; // Import activity log service

// Define a type for the authenticated user on the request object
// Ensure this matches the type attached by your auth middleware
interface AuthenticatedUser {
    id: string;
    role: UserRole; // Make sure role is included
}

// Extend the Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter avaliações com filtros opcionais
export const getReviews = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
  const { serviceId, professionalId, companyId } = req.query;

  // Validar IDs se fornecidos
  if (serviceId && !isValidUUID(serviceId as string)) {
    // Return the response directly
    return res.status(400).json({ message: 'Formato de ID do serviço inválido.' });
  }
  if (professionalId && !isValidUUID(professionalId as string)) {
    // Return the response directly
    return res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
  }
  if (companyId && !isValidUUID(companyId as string)) {
    // Return the response directly
    return res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
  }
  
  try {
    let reviews;
    const filters: Prisma.ReviewWhereInput = {};
    if (serviceId) filters.serviceId = serviceId as string;
    if (professionalId) filters.professionalId = professionalId as string;
    if (companyId) filters.companyId = companyId as string;

    // Exigir pelo menos um filtro
    if (!serviceId && !professionalId && !companyId) {
      // Return the response directly
      return res.status(400).json({ 
        message: "É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações" 
      });
    }

    reviews = await reviewRepository.findMany(filters); // Assuming findMany exists
    
    // Return the response
    return res.json(reviews);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    next(error); // Pass error to error handler
  }
};

// Obter uma avaliação específica pelo ID
export const getReviewById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
  const { id } = req.params;
  if (!isValidUUID(id)) {
    // Return the response directly
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  
  try {
    const review = await reviewRepository.findById(id);
    if (!review) {
      // Return the response directly
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }
    // Return the response
    return res.json(review);
  } catch (error) {
    console.error(`Erro ao buscar avaliação ${id}:`, error);
    next(error); // Pass error to error handler
  }
};

// Criar uma nova avaliação
export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
  // Use authenticated user ID instead of taking it from body
  const userId = req.user?.id;
  const { rating, comment, serviceId, professionalId, companyId } = req.body;

  if (!userId) {
      // Return the response directly
      return res.status(401).json({ message: "Usuário não autenticado." });
  }

  // Validação (Idealmente com express-validator)
  if (!rating || (!serviceId && !professionalId && !companyId)) {
    // Return the response directly
    return res.status(400).json({ 
      message: "Avaliação (rating) e pelo menos um ID de serviço, profissional ou empresa são obrigatórios" 
    });
  }
  if ((serviceId && !isValidUUID(serviceId)) || (professionalId && !isValidUUID(professionalId)) || (companyId && !isValidUUID(companyId))) {
    // Return the response directly
    return res.status(400).json({ message: 'Formato de ID inválido para serviço, profissional ou empresa.' });
  }
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    // Return the response directly
    return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
  }

  try {
    const dataToCreate: Prisma.ReviewCreateInput = {
      rating: numericRating,
      comment: comment,
      user: { connect: { id: userId } },
      ...(serviceId && { service: { connect: { id: serviceId } } }),
      ...(professionalId && { professional: { connect: { id: professionalId } } }),
      ...(companyId && { company: { connect: { id: companyId } } }),
    };

    const newReview = await reviewRepository.create(dataToCreate);

    // --- GAMIFICATION INTEGRATION START ---
    // Trigger REVIEW_CREATED event after successful creation
    // Run this asynchronously, don't block the review creation response
    gamificationService.triggerEvent(userId, GamificationEventType.REVIEW_CREATED, {
        relatedEntityId: newReview.id,
        relatedEntityType: "Review",
    }).catch(err => console.error("Gamification event trigger failed for REVIEW_CREATED:", err));
    // --- GAMIFICATION INTEGRATION END ---

    // --- ACTIVITY LOG INTEGRATION START ---
    // Log activity after successful review creation
    let targetName = 'item'; // Default target name
    try {
        if (serviceId) {
            const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } });
            if (service) targetName = `serviço ${service.name}`;
        } else if (professionalId) {
            const professional = await prisma.professional.findUnique({ where: { id: professionalId }, select: { name: true } });
            if (professional) targetName = `profissional ${professional.name}`;
        } else if (companyId) {
            const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
            if (company) targetName = `empresa ${company.name}`;
        }
    } catch (fetchError) {
        console.error("Error fetching entity name for activity log:", fetchError);
    }

    await logActivity(
        userId,
        'NEW_REVIEW',
        `Você avaliou o ${targetName} com ${numericRating} estrela(s).`,
        { id: newReview.id, type: 'Review' }
    ).catch(err => console.error("Activity logging failed for NEW_REVIEW:", err));
    // --- ACTIVITY LOG INTEGRATION END ---
        
    // Return the response
    return res.status(201).json(newReview);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      // Return the response directly
      return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos.' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // This might happen if service/professional/company ID is invalid
      // Return the response directly
      return res.status(404).json({ message: 'Entidade relacionada (serviço, profissional ou empresa) não encontrada.' });
    }
    next(error); // Pass other errors to error handler
  }
};

// Atualizar uma avaliação existente
export const updateReview = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
  const { id } = req.params;
  const authenticatedUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!authenticatedUserId) {
      // Return the response directly
      return res.status(401).json({ message: "Usuário não autenticado." });
  }

  if (!isValidUUID(id)) {
    // Return the response directly
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  // Exclude fields that should not be updatable directly from body
  const { userId, serviceId, professionalId, companyId, createdAt, updatedAt, ...dataToUpdate } = req.body;
  
  if (dataToUpdate.rating !== undefined) {
    const numericRating = Number(dataToUpdate.rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      // Return the response directly
      return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
    }
    dataToUpdate.rating = numericRating;
  }

  try {
    // Authorization: Check if user is owner or admin
    const existingReview = await reviewRepository.findById(id);
    if (!existingReview) {
        // Return the response directly
        return res.status(404).json({ message: "Avaliação não encontrada para atualização" });
    }
    // Ensure userRole is compared against the enum member
    if (existingReview.userId !== authenticatedUserId && userRole !== UserRole.ADMIN) { 
        // Return the response directly
        return res.status(403).json({ message: "Não autorizado a atualizar esta avaliação." });
    }

    // Check if there's anything to update
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
    }

    const updatedReview = await reviewRepository.update(id, dataToUpdate as Prisma.ReviewUpdateInput);
    // No need to check for null here as Prisma throws P2025 if not found, handled below
        
    // Return the response
    return res.json(updatedReview);
  } catch (error) {
    console.error(`Erro ao atualizar avaliação ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Return the response directly
      return res.status(404).json({ message: "Avaliação não encontrada para atualização." });
    }
    next(error); // Pass other errors to error handler
  }
};

// Deletar uma avaliação
export const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => { 
  const { id } = req.params;
  const authenticatedUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!authenticatedUserId) {
      // Return the response directly
      return res.status(401).json({ message: "Usuário não autenticado." });
  }

  if (!isValidUUID(id)) {
    // Return the response directly
    return res.status(400).json({ message: "Formato de ID inválido." });
  }

  try {
     // Authorization: Check if user is owner or admin
    const existingReview = await reviewRepository.findById(id);
    if (!existingReview) {
        // Return the response directly
        return res.status(404).json({ message: "Avaliação não encontrada para exclusão" });
    }
    // Ensure userRole is compared against the enum member
    if (existingReview.userId !== authenticatedUserId && userRole !== UserRole.ADMIN) { 
        // Return the response directly
        return res.status(403).json({ message: "Não autorizado a deletar esta avaliação." });
    }

    await reviewRepository.delete(id);
    // No need to check for null here as Prisma throws P2025 if not found, handled below
        
    // Use 204 No Content for successful deletion
    // Return the response
    return res.status(204).send(); 
  } catch (error) {
    console.error(`Erro ao deletar avaliação ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Return the response directly
      return res.status(404).json({ message: "Avaliação não encontrada para exclusão." });
    }
    next(error); // Pass other errors to error handler
  }
};

