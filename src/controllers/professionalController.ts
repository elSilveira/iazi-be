import { Request, Response, NextFunction } from "express"; // Import NextFunction
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma } from "@prisma/client";

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter todos os profissionais (opcionalmente filtrados por companyId)
export const getAllProfessionals = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next and void return type
  const { companyId } = req.query;
  // Validar companyId se fornecido
  if (companyId && !isValidUUID(companyId as string)) {
     res.status(400).json({ message: "Formato de ID da empresa inválido." });
     return; // Return void
  }
  try {
    const professionals = await professionalRepository.getAll(companyId as string | undefined);
    res.json(professionals);
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    // Pass error to a potential global error handler
    next(error); // Use next for errors
  }
};

// Obter um profissional específico pelo ID
export const getProfessionalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next and void return type
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return; // Return void
  }
  try {
    const professional = await professionalRepository.findById(id);
    if (!professional) {
      res.status(404).json({ message: "Profissional não encontrado" });
      return; // Return void
    }
    res.json(professional);
  } catch (error) {
    console.error(`Erro ao buscar profissional ${id}:`, error);
    next(error); // Use next for errors
  }
};

// Criar um novo profissional
export const createProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next and void return type
  // Extrair dados do corpo da requisição, incluindo serviceIds
  const { name, role, image, companyId, serviceIds } = req.body;

  // Validação básica (melhor feita com express-validator, mas mantendo aqui por enquanto)
  if (!name || !role || !companyId) {
    res.status(400).json({ message: "Nome, cargo e ID da empresa são obrigatórios" });
    return;
  }
  if (!isValidUUID(companyId)) {
    res.status(400).json({ message: "Formato de ID da empresa inválido." });
    return;
  }
  if (serviceIds !== undefined) {
    if (!Array.isArray(serviceIds)) {
      res.status(400).json({ message: "serviceIds deve ser um array." });
      return;
    }
    if (!serviceIds.every(isValidUUID)) {
      res.status(400).json({ message: "Um ou mais serviceIds possuem formato inválido." });
      return;
    }
  }

  try {
    const dataToCreate: Prisma.ProfessionalCreateInput = {
      name,
      role,
      image: image,
      company: { connect: { id: companyId } },
    };

    const newProfessional = await professionalRepository.create(dataToCreate, serviceIds as string[] | undefined);
    res.status(201).json(newProfessional);
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003" && error.meta?.field_name === "Professional_companyId_fkey (index)") {
         res.status(400).json({ message: "ID da empresa inválido." });
         return;
      }
      if (error.code === "P2025") {
        res.status(400).json({ message: "Um ou mais IDs de serviço fornecidos são inválidos." });
        return;
      }
    }
    next(error); // Use next for other errors
  }
};

// Atualizar um profissional existente
export const updateProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next and void return type
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  const { companyId, serviceIds, ...dataToUpdate } = req.body;

  if (serviceIds !== undefined) {
     if (!Array.isArray(serviceIds)) {
      res.status(400).json({ message: "serviceIds deve ser um array." });
      return;
    }
    if (!serviceIds.every(isValidUUID)) {
      res.status(400).json({ message: "Um ou mais serviceIds possuem formato inválido." });
      return;
    }
  }

  try {
    const updatedProfessional = await professionalRepository.update(id, dataToUpdate as Prisma.ProfessionalUpdateInput, serviceIds as string[] | undefined);
    if (!updatedProfessional) {
      res.status(404).json({ message: "Profissional não encontrado para atualização" });
      return;
    }
    res.json(updatedProfessional);
  } catch (error) {
    console.error(`Erro ao atualizar profissional ${id}:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        res.status(404).json({ message: "Profissional ou um dos serviços associados não encontrado." });
        return;
    }
    next(error); // Use next for other errors
  }
};

// Deletar um profissional
export const deleteProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next and void return type
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }

  try {
    const deletedProfessional = await professionalRepository.delete(id);
    if (!deletedProfessional) {
      res.status(404).json({ message: "Profissional não encontrado para exclusão" });
      return;
    }
    // Changed to 204 No Content for successful deletion without returning body
    res.status(204).send(); 
  } catch (error) {
    console.error(`Erro ao deletar profissional ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        res.status(409).json({ message: "Não é possível excluir o profissional pois existem registros associados que impedem a exclusão." });
        return;
    }
    next(error); // Use next for other errors
  }
};

// Add Service to Professional (Placeholder - needs implementation in repository)
export const addServiceToProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement logic to associate service with professional
    res.status(501).json({ message: "Not Implemented" });
};

// Remove Service from Professional (Placeholder - needs implementation in repository)
export const removeServiceFromProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement logic to disassociate service from professional
    res.status(501).json({ message: "Not Implemented" });
};

