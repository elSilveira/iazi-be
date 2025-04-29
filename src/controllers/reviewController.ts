import { Request, Response } from 'express';
import { reviewRepository } from '../repositories/reviewRepository';
import { Prisma } from '@prisma/client';

// Obter avaliações com filtros opcionais
export const getReviews = async (req: Request, res: Response): Promise<Response> => {
  const { serviceId, professionalId, companyId } = req.query;
  
  try {
    let reviews;
    
    // Filtrar por serviço
    if (serviceId) {
      reviews = await reviewRepository.findByService(serviceId as string);
    } 
    // Filtrar por profissional
    else if (professionalId) {
      reviews = await reviewRepository.findByProfessional(professionalId as string);
    } 
    // Filtrar por empresa
    else if (companyId) {
      reviews = await reviewRepository.findByCompany(companyId as string);
    } 
    // Caso contrário, retornar erro (exigir um filtro para evitar consultas muito grandes)
    else {
      return res.status(400).json({ 
        message: 'É necessário fornecer serviceId, professionalId ou companyId para filtrar as avaliações' 
      });
    }
    
    return res.json(reviews);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter uma avaliação específica pelo ID
export const getReviewById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  try {
    const review = await reviewRepository.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    return res.json(review);
  } catch (error) {
    console.error(`Erro ao buscar avaliação ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Criar uma nova avaliação
export const createReview = async (req: Request, res: Response): Promise<Response> => {
  const data: Prisma.ReviewCreateInput = req.body;
  
  // Validação básica
  if (!data.rating || !data.userId || (!data.serviceId && !data.professionalId && !data.companyId)) {
    return res.status(400).json({ 
      message: 'Avaliação (rating), ID do usuário e pelo menos um ID de serviço, profissional ou empresa são obrigatórios' 
    });
  }

  // Validar a avaliação (rating)
  if (data.rating < 1 || data.rating > 5) {
    return res.status(400).json({ message: 'A avaliação deve ser um valor entre 1 e 5' });
  }

  try {
    const newReview = await reviewRepository.create(data);
    
    // TODO: Implementar lógica para atualizar a média de avaliação na entidade relacionada
    // (Service, Professional ou Company) após criar a avaliação.
    
    return res.status(201).json(newReview);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    // Verificar erros de chave estrangeira
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(400).json({ message: 'Um ou mais IDs fornecidos são inválidos.' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar uma avaliação existente
export const updateReview = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const data: Prisma.ReviewUpdateInput = req.body;
  
  // Validar a avaliação (rating) se fornecida
  if (data.rating !== undefined && (data.rating as number < 1 || data.rating as number > 5)) {
    return res.status(400).json({ message: 'A avaliação deve ser um valor entre 1 e 5' });
  }

  try {
    const updatedReview = await reviewRepository.update(id, data);
    if (!updatedReview) {
      return res.status(404).json({ message: 'Avaliação não encontrada para atualização' });
    }
    
    // TODO: Implementar lógica para recalcular a média de avaliação na entidade relacionada
    // após atualizar a avaliação.
    
    return res.json(updatedReview);
  } catch (error) {
    console.error(`Erro ao atualizar avaliação ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Deletar uma avaliação
export const deleteReview = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    const deletedReview = await reviewRepository.delete(id);
    if (!deletedReview) {
      return res.status(404).json({ message: 'Avaliação não encontrada para exclusão' });
    }
    
    // TODO: Implementar lógica para recalcular a média de avaliação na entidade relacionada
    // após deletar a avaliação.
    
    return res.status(200).json({ 
      message: 'Avaliação excluída com sucesso', 
      review: deletedReview 
    });
  } catch (error) {
    console.error(`Erro ao deletar avaliação ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
