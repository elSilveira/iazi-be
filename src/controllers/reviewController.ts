import { Request, Response, NextFunction } from "express"; // Import NextFunction
import { reviewRepository } from "../repositories/reviewRepository";
import { Prisma } from "@prisma/client";

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter avaliações com filtros opcionais
export const getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { serviceId, professionalId, companyId } = req.query;

  // Validar IDs se fornecidos
  if (serviceId && !isValidUUID(serviceId as string)) {
    res.status(400).json({ message: 'Formato de ID do serviço inválido.' });
    return;
  }
  if (professionalId && !isValidUUID(professionalId as string)) {
    res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
    return;
  }
  if (companyId && !isValidUUID(companyId as string)) {
    res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
    return;
  }
  
  try {
    let reviews;
    const filters: Prisma.ReviewWhereInput = {};
    if (serviceId) filters.serviceId = serviceId as string;
    if (professionalId) filters.professionalId = professionalId as string;
    if (companyId) filters.companyId = companyId as string;

    // Exigir pelo menos um filtro
    if (!serviceId && !professionalId && !companyId) {
      res.status(400).json({ 
        message: "É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações" 
      });
      return;
    }

    reviews = await reviewRepository.findMany(filters); // Assuming findMany exists
    
    res.json(reviews);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    next(error); // Pass error to error handler
  }
};

// Obter uma avaliação específica pelo ID
export const getReviewById = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  
  try {
    const review = await reviewRepository.findById(id);
    if (!review) {
      res.status(404).json({ message: "Avaliação não encontrada" });
      return;
    }
    res.json(review);
  } catch (error) {
    console.error(`Erro ao buscar avaliação ${id}:`, error);
    next(error); // Pass error to error handler
  }
};

// Criar uma nova avaliação
export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { rating, comment, userId, serviceId, professionalId, companyId } = req.body;

  // Validação (Idealmente com express-validator)
  if (!rating || !userId || (!serviceId && !professionalId && !companyId)) {
    res.status(400).json({ 
      message: "Avaliação (rating), ID do usuário e pelo menos um ID de serviço, profissional ou empresa são obrigatórios" 
    });
    return;
  }
  if (!isValidUUID(userId) || (serviceId && !isValidUUID(serviceId)) || (professionalId && !isValidUUID(professionalId)) || (companyId && !isValidUUID(companyId))) {
    res.status(400).json({ message: 'Formato de ID inválido para usuário, serviço, profissional ou empresa.' });
    return;
  }
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
    return;
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
        
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos.' });
      return;
    }
    next(error); // Pass other errors to error handler
  }
};

// Atualizar uma avaliação existente
export const updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  const { userId, serviceId, professionalId, companyId, ...dataToUpdate } = req.body;
  
  if (dataToUpdate.rating !== undefined) {
    const numericRating = Number(dataToUpdate.rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
      return;
    }
    dataToUpdate.rating = numericRating;
  }

  try {
    const updatedReview = await reviewRepository.update(id, dataToUpdate as Prisma.ReviewUpdateInput);
    if (!updatedReview) {
      res.status(404).json({ message: "Avaliação não encontrada para atualização" });
      return;
    }
        
    res.json(updatedReview);
  } catch (error) {
    console.error(`Erro ao atualizar avaliação ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: "Avaliação não encontrada para atualização." });
      return;
    }
    next(error); // Pass other errors to error handler
  }
};

// Deletar uma avaliação
export const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }

  try {
    const deletedReview = await reviewRepository.delete(id);
    if (!deletedReview) {
      res.status(404).json({ message: "Avaliação não encontrada para exclusão" });
      return;
    }
        
    // Use 204 No Content for successful deletion
    res.status(204).send(); 
  } catch (error) {
    console.error(`Erro ao deletar avaliação ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: "Avaliação não encontrada para exclusão." });
      return;
    }
    next(error); // Pass other errors to error handler
  }
};

