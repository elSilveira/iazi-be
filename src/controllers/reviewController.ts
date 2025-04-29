import { Request, Response } from "express";
import { reviewRepository } from "../repositories/reviewRepository";
import { Prisma } from "@prisma/client";

// Função auxiliar para tratamento de erros
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos.' });
    }
    if (error.code === 'P2025') {
      // O repositório já trata P2025 retornando null, mas podemos logar
      console.error("Prisma Error P2025: Record not found.");
      // Não retornamos aqui, pois o controlador já trata o null
    }
  }
  return res.status(500).json({ message: 'Erro interno do servidor' });
};

// Obter avaliações com filtros opcionais
export const getReviews = async (req: Request, res: Response): Promise<Response> => {
  const { serviceId, professionalId, companyId } = req.query;
  
  try {
    let reviews;
    
    if (serviceId) {
      reviews = await reviewRepository.findByService(serviceId as string);
    } 
    else if (professionalId) {
      reviews = await reviewRepository.findByProfessional(professionalId as string);
    } 
    else if (companyId) {
      reviews = await reviewRepository.findByCompany(companyId as string);
    } 
    else {
      return res.status(400).json({ 
        message: "É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações" 
      });
    }
    
    return res.json(reviews);
  } catch (error) {
    return handleError(res, error, 'Erro ao buscar avaliações:');
  }
};

// Obter uma avaliação específica pelo ID
export const getReviewById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  try {
    const review = await reviewRepository.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }
    return res.json(review);
  } catch (error) {
    return handleError(res, error, `Erro ao buscar avaliação ${id}:`);
  }
};

// Criar uma nova avaliação
export const createReview = async (req: Request, res: Response): Promise<Response> => {
  // Extrair dados do corpo da requisição
  const { rating, comment, userId, serviceId, professionalId, companyId } = req.body;

  // Validação básica
  if (!rating || !userId || (!serviceId && !professionalId && !companyId)) {
    return res.status(400).json({ 
      message: "Avaliação (rating), ID do usuário e pelo menos um ID de serviço, profissional ou empresa são obrigatórios" 
    });
  }

  // Validar a avaliação (rating)
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
  }

  try {
    // Montar o objeto de dados para o Prisma usando 'connect'
    const dataToCreate: Prisma.ReviewCreateInput = {
      rating: numericRating,
      comment: comment, // comment é opcional
      user: { connect: { id: userId } },
      // Conectar apenas à entidade relevante (service, professional ou company)
      ...(serviceId && { service: { connect: { id: serviceId } } }),
      ...(professionalId && { professional: { connect: { id: professionalId } } }),
      ...(companyId && { company: { connect: { id: companyId } } }),
    };

    const newReview = await reviewRepository.create(dataToCreate);
    
    // TODO: Implementar lógica para atualizar a média de avaliação na entidade relacionada
    
    return res.status(201).json(newReview);
  } catch (error) {
    return handleError(res, error, 'Erro ao criar avaliação:');
  }
};

// Atualizar uma avaliação existente
export const updateReview = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Não permitir alterar userId, serviceId, professionalId, companyId via update
  const { userId, serviceId, professionalId, companyId, ...dataToUpdate } = req.body;
  
  // Validar a avaliação (rating) se fornecida
  if (dataToUpdate.rating !== undefined) {
    const numericRating = Number(dataToUpdate.rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "A avaliação deve ser um valor numérico entre 1 e 5" });
    }
    dataToUpdate.rating = numericRating; // Garantir que seja número
  }

  try {
    const updatedReview = await reviewRepository.update(id, dataToUpdate as Prisma.ReviewUpdateInput);
    if (!updatedReview) {
      return res.status(404).json({ message: "Avaliação não encontrada para atualização" });
    }
    
    // TODO: Implementar lógica para recalcular a média de avaliação na entidade relacionada
    
    return res.json(updatedReview);
  } catch (error) {
    return handleError(res, error, `Erro ao atualizar avaliação ${id}:`);
  }
};

// Deletar uma avaliação
export const deleteReview = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    const deletedReview = await reviewRepository.delete(id);
    if (!deletedReview) {
      return res.status(404).json({ message: "Avaliação não encontrada para exclusão" });
    }
    
    // TODO: Implementar lógica para recalcular a média de avaliação na entidade relacionada
    
    return res.status(200).json({ 
      message: "Avaliação excluída com sucesso", 
      review: deletedReview 
    });
  } catch (error) {
    return handleError(res, error, `Erro ao deletar avaliação ${id}:`);
  }
};

