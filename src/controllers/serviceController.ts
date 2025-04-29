import { Request, Response } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import { Prisma } from "@prisma/client"; // Revertido: Importar de @prisma/client

// Obter todos os serviços (opcionalmente filtrados por companyId)
export const getAllServices = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  try {
    const services = await serviceRepository.getAll(companyId as string | undefined);
    return res.json(services);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Obter um serviço específico pelo ID
export const getServiceById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  try {
    const service = await serviceRepository.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado" });
    }
    return res.json(service);
  } catch (error) {
    console.error(`Erro ao buscar serviço ${id}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Criar um novo serviço
export const createService = async (req: Request, res: Response): Promise<Response> => {
  const data: Prisma.ServiceCreateInput = req.body;
  // Validação básica
  if (!data.name || !data.price || !data.companyId) {
    return res.status(400).json({ message: "Nome, preço e ID da empresa são obrigatórios" });
  }

  try {
    const newService = await serviceRepository.create(data);
    return res.status(201).json(newService);
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return res.status(400).json({ message: "ID da empresa inválido." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Atualizar um serviço existente
export const updateService = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const data: Prisma.ServiceUpdateInput = req.body;

  try {
    const updatedService = await serviceRepository.update(id, data);
    if (!updatedService) {
      return res.status(404).json({ message: "Serviço não encontrado para atualização" });
    }
    return res.json(updatedService);
  } catch (error) {
    console.error(`Erro ao atualizar serviço ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Serviço não encontrado para atualização." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Deletar um serviço
export const deleteService = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    const deletedService = await serviceRepository.delete(id);
    if (!deletedService) {
      return res.status(404).json({ message: "Serviço não encontrado para exclusão" });
    }
    return res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
  } catch (error) {
    console.error(`Erro ao deletar serviço ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({ message: "Serviço não encontrado para exclusão." });
      }
      if (error.code === "P2003") {
        return res.status(409).json({ message: "Não é possível excluir o serviço pois existem registros associados." });
      }
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
