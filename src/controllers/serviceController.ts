import { Request, Response } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
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
    if (error.code === "P2003") {
      // FK constraint failed
      return res.status(400).json({ message: "ID da empresa inválido." });
    }
    if (error.code === "P2025") {
      // Record not found for update/delete
      return res.status(404).json({ message: "Registro não encontrado para a operação." });
    }
  }
  return res.status(500).json({ message: "Erro interno do servidor" });
};

// Obter todos os serviços (opcionalmente filtrados por companyId)
export const getAllServices = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  // Validar companyId se fornecido
  if (companyId && !isValidUUID(companyId as string)) {
     return res.status(400).json({ message: "Formato de ID da empresa inválido." });
  }
  try {
    const services = await serviceRepository.getAll(companyId as string | undefined);
    return res.json(services);
  } catch (error) {
    return handleError(res, error, "Erro ao buscar serviços:");
  }
};

// Obter um serviço específico pelo ID
export const getServiceById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  try {
    const service = await serviceRepository.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado" });
    }
    return res.json(service);
  } catch (error) {
    return handleError(res, error, `Erro ao buscar serviço ${id}:`);
  }
};

// Criar um novo serviço
export const createService = async (req: Request, res: Response): Promise<Response> => {
  // Extrair dados do corpo da requisição
  const { name, description, price, duration, image, category, companyId } = req.body;

  // Validação básica
  if (!name || price === undefined || !companyId) {
    return res.status(400).json({ message: "Nome, preço e ID da empresa são obrigatórios" });
  }
  // Validar formato do companyId
  if (!isValidUUID(companyId)) {
    return res.status(400).json({ message: "Formato de ID da empresa inválido." });
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: "O preço deve ser um valor numérico não negativo." });
  }

  const numericDuration = duration !== undefined ? Number(duration) : undefined;
  if (numericDuration !== undefined && (isNaN(numericDuration) || numericDuration <= 0)) {
    return res.status(400).json({ message: "A duração deve ser um valor numérico positivo, se fornecida." });
  }

  try {
    // Montar o objeto de dados para o Prisma usando 'connect'
    const dataToCreate: Prisma.ServiceCreateInput = {
      name,
      description: description, // opcional
      price: String(numericPrice),
      duration: numericDuration !== undefined ? String(numericDuration) : "", // opcional, default to empty string
      image: image, // opcional
      category: category, // opcional
      company: { connect: { id: companyId } },
      // rating, appointments, professionals, reviews são definidos por padrão no schema
    };

    const newService = await serviceRepository.create(dataToCreate);
    return res.status(201).json(newService);
  } catch (error) {
    return handleError(res, error, "Erro ao criar serviço:");
  }
};

// Atualizar um serviço existente
export const updateService = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  // Não permitir atualização do companyId via este endpoint
  const { companyId, ...dataToUpdate } = req.body;

  // Validar preço se fornecido
  if (dataToUpdate.price !== undefined) {
    const numericPrice = Number(dataToUpdate.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: "O preço deve ser um valor numérico não negativo." });
    }
    dataToUpdate.price = String(numericPrice); // Manter como string no DB
  }

  // Validar duração se fornecida
  if (dataToUpdate.duration !== undefined) {
    const numericDuration = Number(dataToUpdate.duration);
    if (isNaN(numericDuration) || numericDuration <= 0) {
      return res.status(400).json({ message: "A duração deve ser um valor numérico positivo." });
    }
    dataToUpdate.duration = String(numericDuration); // Manter como string no DB
  }

  try {
    const updatedService = await serviceRepository.update(id, dataToUpdate as Prisma.ServiceUpdateInput);
    if (!updatedService) {
      return res.status(404).json({ message: "Serviço não encontrado para atualização" });
    }
    return res.json(updatedService);
  } catch (error) {
    return handleError(res, error, `Erro ao atualizar serviço ${id}:`);
  }
};

// Deletar um serviço
export const deleteService = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }

  try {
    const deletedService = await serviceRepository.delete(id);
    if (!deletedService) {
      // O repositório já trata P2025 retornando null
      return res.status(404).json({ message: "Serviço não encontrado para exclusão" });
    }
    return res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
  } catch (error) {
    // Tratar erro P2003 (FK constraint) se houver dependências não tratadas no repositório
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return res.status(409).json({ message: "Não é possível excluir o serviço pois existem registros associados (ex: agendamentos, avaliações)." });
    }
    return handleError(res, error, `Erro ao deletar serviço ${id}:`);
  }
};

