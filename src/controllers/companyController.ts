import { Request, Response } from "express";
import { companyRepository } from "../repositories/companyRepository";
import { Prisma } from "@prisma/client"; // Revertido: Importar de @prisma/client

// Obter todas as empresas
export const getAllCompanies = async (req: Request, res: Response): Promise<Response> => {
  try {
    const companies = await companyRepository.getAll();
    return res.json(companies);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Obter uma empresa específica pelo ID
export const getCompanyById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  try {
    const company = await companyRepository.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Empresa não encontrada" });
    }
    return res.json(company);
  } catch (error) {
    console.error(`Erro ao buscar empresa ${id}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Criar uma nova empresa
export const createCompany = async (req: Request, res: Response): Promise<Response> => {
  const data: Prisma.CompanyCreateInput = req.body;
  // Validação básica
  if (!data.name || !data.email) {
    return res.status(400).json({ message: "Nome e email são obrigatórios" });
  }
  // TODO: Adicionar validação mais robusta (ex: formato de email, telefone)
  // TODO: Tratar a criação do endereço associado (data.address)

  try {
    const newCompany = await companyRepository.create(data);
    return res.status(201).json(newCompany);
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Verificar qual campo causou a violação (ex: email)
      if (error.meta?.target === 'Company_email_key') {
          return res.status(409).json({ message: "Email já cadastrado para outra empresa." });
      }
      return res.status(409).json({ message: "Erro de conflito ao criar empresa (possível duplicidade)." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Atualizar uma empresa existente
export const updateCompany = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const data: Prisma.CompanyUpdateInput = req.body;
  // TODO: Tratar a atualização do endereço associado (data.address)

  try {
    const updatedCompany = await companyRepository.update(id, data);
    if (!updatedCompany) {
      return res.status(404).json({ message: "Empresa não encontrada para atualização" });
    }
    return res.json(updatedCompany);
  } catch (error) {
    console.error(`Erro ao atualizar empresa ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: "Erro de conflito ao atualizar empresa (possível duplicidade de email)." });
    }
    // O erro P2025 (Not Found) já é tratado pelo retorno null do repositório
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Deletar uma empresa
export const deleteCompany = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    // O repositório já deve lidar com a exclusão em cascata ou manual do endereço, se configurado
    const deletedCompany = await companyRepository.delete(id);
    if (!deletedCompany) {
      return res.status(404).json({ message: "Empresa não encontrada para exclusão" });
    }
    return res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
  } catch (error) {
    console.error(`Erro ao deletar empresa ${id}:`, error);
    // O erro P2025 (Not Found) já é tratado pelo retorno null do repositório
    // Tratar outros erros potenciais (ex: P2003 - Foreign key constraint, se houver dependências não tratadas)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return res.status(409).json({ message: "Não é possível excluir a empresa pois existem registros associados (ex: profissionais, serviços)." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
