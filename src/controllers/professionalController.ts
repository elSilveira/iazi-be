import { Request, Response } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma } from "@prisma/client";

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter todos os profissionais (opcionalmente filtrados por companyId)
export const getAllProfessionals = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  // Validar companyId se fornecido
  if (companyId && !isValidUUID(companyId as string)) {
     return res.status(400).json({ message: "Formato de ID da empresa inválido." });
  }
  try {
    const professionals = await professionalRepository.getAll(companyId as string | undefined);
    return res.json(professionals);
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Obter um profissional específico pelo ID
export const getProfessionalById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  try {
    const professional = await professionalRepository.findById(id);
    if (!professional) {
      return res.status(404).json({ message: "Profissional não encontrado" });
    }
    return res.json(professional);
  } catch (error) {
    console.error(`Erro ao buscar profissional ${id}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Criar um novo profissional
export const createProfessional = async (req: Request, res: Response): Promise<Response> => {
  // Extrair dados do corpo da requisição, incluindo serviceIds
  const { name, role, image, companyId, serviceIds } = req.body;

  // Validação básica
  if (!name || !role || !companyId) {
    return res.status(400).json({ message: "Nome, cargo e ID da empresa são obrigatórios" });
  }
  // Validar formato do companyId
  if (!isValidUUID(companyId)) {
    return res.status(400).json({ message: "Formato de ID da empresa inválido." });
  }
  // Validar serviceIds (se fornecido, deve ser um array de UUIDs)
  if (serviceIds !== undefined) {
    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ message: "serviceIds deve ser um array." });
    }
    if (!serviceIds.every(isValidUUID)) {
      return res.status(400).json({ message: "Um ou mais serviceIds possuem formato inválido." });
    }
  }

  try {
    // Montar o objeto de dados para o Prisma usando 'connect'
    const dataToCreate: Prisma.ProfessionalCreateInput = {
      name,
      role,
      image: image, // image é opcional
      company: { connect: { id: companyId } },
      // rating e appointments são definidos por padrão no schema
    };

    // Passar serviceIds para o repositório
    const newProfessional = await professionalRepository.create(dataToCreate, serviceIds as string[] | undefined);
    return res.status(201).json(newProfessional);
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        // Verificar se a FK violada foi companyId
        if (error.meta?.field_name === "Professional_companyId_fkey (index)") {
           return res.status(400).json({ message: "ID da empresa inválido." });
        }
        // Pode ser erro de serviceId inválido também, tratado pela transação no repo
        return res.status(400).json({ message: "Erro de chave estrangeira ao criar profissional (empresa ou serviço inválido)." });
      }
      if (error.code === "P2025") {
        // Pode ocorrer se um serviceId não for encontrado durante a transação
        return res.status(400).json({ message: "Um ou mais IDs de serviço fornecidos são inválidos." });
      }
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Atualizar um profissional existente
export const updateProfessional = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  // Extrair dados, incluindo serviceIds. Não permitir atualização do companyId.
  const { companyId, serviceIds, ...dataToUpdate } = req.body;

  // Validar serviceIds (se fornecido, deve ser um array de UUIDs)
  if (serviceIds !== undefined) {
     if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ message: "serviceIds deve ser um array." });
    }
    if (!serviceIds.every(isValidUUID)) {
      return res.status(400).json({ message: "Um ou mais serviceIds possuem formato inválido." });
    }
  }

  try {
    // Passar serviceIds para o repositório
    const updatedProfessional = await professionalRepository.update(id, dataToUpdate as Prisma.ProfessionalUpdateInput, serviceIds as string[] | undefined);
    if (!updatedProfessional) {
      return res.status(404).json({ message: "Profissional não encontrado para atualização" });
    }
    return res.json(updatedProfessional);
  } catch (error) {
    console.error(`Erro ao atualizar profissional ${id}:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // Pode ocorrer se o profissional ou um serviceId não for encontrado
        return res.status(404).json({ message: "Profissional ou um dos serviços associados não encontrado." });
      }
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Deletar um profissional
export const deleteProfessional = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }

  try {
    const deletedProfessional = await professionalRepository.delete(id);
    if (!deletedProfessional) {
      return res.status(404).json({ message: "Profissional não encontrado para exclusão" });
    }
    return res.status(200).json({ message: "Profissional excluído com sucesso", professional: deletedProfessional });
  } catch (error) {
    console.error(`Erro ao deletar profissional ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        // O repositório tenta desassociar, mas se houver FK constraint não tratada (ex: em Appointment/Review sem onDelete: SET NULL)
        return res.status(409).json({ message: "Não é possível excluir o profissional pois existem registros associados que impedem a exclusão." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

