import { Request, Response } from "express";
import { reviewRepository } from "../repositories/reviewRepository";
import { Prisma } from "@prisma/client";

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Função auxiliar para tratamento de erros
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço, profissional ou empresa) são inválidos.' });
    }
    if (error.code === 'P2025') {
      console.error("Prisma Error P2025: Record not found.");
      // O repositório deve retornar null, e o controlador deve tratar isso com 404
    }
  }
  return res.status(500).json({ message: 'Erro interno do servidor' });
};

// Obter avaliações com filtros opcionais
export const getReviews = async (req: Request, res: Response): Promise<Response> => {
  const { serviceId, professionalId, companyId } = req.query;

  // Validar IDs se fornecidos
  if (serviceId && !isValidUUID(serviceId as string)) {
    return res.status(400).json({ message: 'Formato de ID do serviço inválido.' });
  }
  if (professionalId && !isValidUUID(professionalId as string)) {
    return res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
  }
  if (companyId && !isValidUUID(companyId as string)) {
    return res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
  }
  
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
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  
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
  // Validar formato dos IDs
  if (!isValidUUID(userId)) {
    return res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
  }
  if (serviceId && !isValidUUID(serviceId)) {
    return res.status(400).json({ message: 'Formato de ID do serviço inválido.' });
  }
  if (professionalId && !isValidUUID(professionalId)) {
    return res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
  }
  if (companyId && !isValidUUID(companyId)) {
    return res.status(400).json({ message: 'Formato de ID da empresa inválido.' });
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

    // O repositório agora trata a atualização da média
    const newReview = await reviewRepository.create(dataToCreate);
        
    return res.status(201).json(newReview);
  } catch (error) {
    return handleError(res, error, 'Erro ao criar avaliação:');
  }
};

// Atualizar uma avaliação existente
export const updateReview = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
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
    // O repositório agora trata a atualização da média
    const updatedReview = await reviewRepository.update(id, dataToUpdate as Prisma.ReviewUpdateInput);
    if (!updatedReview) {
      return res.status(404).json({ message: "Avaliação não encontrada para atualização" });
    }
        
    return res.json(updatedReview);
  } catch (error) {
    return handleError(res, error, `Erro ao atualizar avaliação ${id}:`);
  }
};

// Deletar uma avaliação
export const deleteReview = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }

  try {
    // O repositório agora trata a atualização da média
    const deletedReview = await reviewRepository.delete(id);
    if (!deletedReview) {
      return res.status(404).json({ message: "Avaliação não encontrada para exclusão" });
    }
        
    return res.status(200).json({ 
      message: "Avaliação excluída com sucesso", 
      review: deletedReview 
    });
  } catch (error) {
    return handleError(res, error, `Erro ao deletar avaliação ${id}:`);
  }
};

