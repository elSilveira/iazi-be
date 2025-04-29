import { Request, Response } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma } from "@prisma/client"; // Revertido: Importar de @prisma/client

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
  const data: Prisma.ProfessionalCreateInput = req.body;
  // Validação básica
  if (!data.name || !data.role || !data.companyId) {
    return res.status(400).json({ message: "Nome, cargo e ID da empresa são obrigatórios" });
  }

  try {
    const newProfessional = await professionalRepository.create(data);
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
  const data: Prisma.ProfessionalUpdateInput = req.body;

  try {
    const updatedProfessional = await professionalRepository.update(id, data);
    if (!updatedProfessional) {
      return res.status(404).json({ message: "Profissional não encontrado para atualização" });
    }
    // TODO: Implementar lógica para atualizar/conectar serviços.
    return res.json(updatedProfessional);
  } catch (error) {
    console.error(`Erro ao atualizar profissional ${id}:`, error);
    // O erro P2025 (Not Found) já é tratado pelo retorno null do repositório
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Deletar um profissional
export const deleteProfessional = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    // O repositório já lida com a exclusão de ProfessionalService
    const deletedProfessional = await professionalRepository.delete(id);
    if (!deletedProfessional) {
      return res.status(404).json({ message: "Profissional não encontrado para exclusão" });
    }
    return res.status(200).json({ message: "Profissional excluído com sucesso", professional: deletedProfessional });
  } catch (error) {
    console.error(`Erro ao deletar profissional ${id}:`, error);
    // O erro P2025 (Not Found) já é tratado pelo retorno null do repositório
    // Tratar erro P2003 se houver FKs não tratadas (ex: Appointment, Review)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return res.status(409).json({ message: "Não é possível excluir o profissional pois existem registros associados (ex: agendamentos, avaliações)." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
