import { Request, Response, NextFunction } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import { Prisma } from "@prisma/client";

// Obter todos os serviços (opcionalmente filtrados por companyId)
export const getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { companyId } = req.query;
  // A validação do formato do companyId (se fornecido) será feita pelo express-validator
  try {
    const services = await serviceRepository.getAll(companyId as string | undefined);
    res.json(services);
  } catch (error) {
    next(error); // Passa o erro para o middleware global
  }
};

// Obter um serviço específico pelo ID
export const getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // A validação do formato do ID será feita pelo express-validator
  try {
    const service = await serviceRepository.findById(id);
    if (!service) {
      // Lança um erro que será capturado pelo middleware global (P2025)
      const error: any = new Error("Serviço não encontrado");
      error.statusCode = 404;
      return next(error);
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
};

// Criar um novo serviço
export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // A validação dos dados (nome, preço, companyId, etc.) será feita pelo express-validator
  const { name, description, price, duration, image, category, companyId } = req.body;

  try {
    // Montar o objeto de dados para o Prisma usando 'connect'
    // Os validadores devem garantir que price e duration são strings válidas
    const dataToCreate: Prisma.ServiceCreateInput = {
      name,
      description,
      price, // Assumindo que o validator garante que é uma string válida
      duration, // Assumindo que o validator garante que é uma string válida
      image,
      category,
      company: { connect: { id: companyId } },
    };

    const newService = await serviceRepository.create(dataToCreate);
    res.status(201).json(newService);
  } catch (error) {
    // Erros, incluindo P2003 (FK inválida), serão tratados pelo middleware global
    next(error);
  }
};

// Atualizar um serviço existente
export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // A validação do formato do ID e dos dados do body será feita pelo express-validator
  // Não permitir atualização do companyId via este endpoint
  const { companyId, ...dataToUpdate } = req.body;

  try {
    // Os validadores devem garantir que price e duration (se fornecidos) são strings válidas
    const updatedService = await serviceRepository.update(id, dataToUpdate as Prisma.ServiceUpdateInput);
    // O repositório deve lançar um erro se o serviço não for encontrado (Prisma P2025)
    // que será tratado pelo middleware global
    res.json(updatedService);
  } catch (error) {
    // Erros, incluindo P2025 (não encontrado), serão tratados pelo middleware global
    next(error);
  }
};

// Deletar um serviço
export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // A validação do formato do ID será feita pelo express-validator

  try {
    const deletedService = await serviceRepository.delete(id);
    // O repositório deve lançar um erro se o serviço não for encontrado (Prisma P2025)
    // que será tratado pelo middleware global
    res.status(200).json({ message: "Serviço excluído com sucesso", service: deletedService });
  } catch (error) {
    // Erros, incluindo P2025 (não encontrado) ou P2003 (restrição FK), serão tratados pelo middleware global
    next(error);
  }
};

