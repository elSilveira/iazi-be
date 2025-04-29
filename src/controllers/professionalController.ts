import { Request, Response } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma } from "@prisma/client";

// Obter todos os profissionais (opcionalmente filtrados por companyId)
export const getAllProfessionals = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
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
  // Extrair dados do corpo da requisição
  const { name, role, image, companyId } = req.body;

  // Validação básica
  if (!name || !role || !companyId) {
    return res.status(400).json({ message: "Nome, cargo e ID da empresa são obrigatórios" });
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

    const newProfessional = await professionalRepository.create(dataToCreate);
    // TODO: Implementar lógica para conectar a serviços (ProfessionalService) após criar o profissional.
    return res.status(201).json(newProfessional);
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      // Verificar se a FK violada foi companyId
      if (error.meta?.field_name === "Professional_companyId_fkey (index)") {
         return res.status(400).json({ message: "ID da empresa inválido." });
      }
      return res.status(400).json({ message: "Erro de chave estrangeira ao criar profissional." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Atualizar um profissional existente
export const updateProfessional = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Não permitir atualização do companyId via este endpoint
  const { companyId, ...dataToUpdate } = req.body;

  try {
    const updatedProfessional = await professionalRepository.update(id, dataToUpdate as Prisma.ProfessionalUpdateInput);
    if (!updatedProfessional) {
      return res.status(404).json({ message: "Profissional não encontrado para atualização" });
    }
    // TODO: Implementar lógica para atualizar/conectar serviços.
    return res.json(updatedProfessional);
  } catch (error) {
    console.error(`Erro ao atualizar profissional ${id}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Deletar um profissional
export const deleteProfessional = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    const deletedProfessional = await professionalRepository.delete(id);
    if (!deletedProfessional) {
      return res.status(404).json({ message: "Profissional não encontrado para exclusão" });
    }
    return res.status(200).json({ message: "Profissional excluído com sucesso", professional: deletedProfessional });
  } catch (error) {
    console.error(`Erro ao deletar profissional ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return res.status(409).json({ message: "Não é possível excluir o profissional pois existem registros associados (ex: agendamentos, avaliações)." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

