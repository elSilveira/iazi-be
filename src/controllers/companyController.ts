import { Request, Response } from "express";
import { companyRepository } from "../repositories/companyRepository";
import { Prisma } from "@prisma/client";

// Helper function for email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^"]+@[^"]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Helper function for Brazilian CEP validation (basic format check)
const isValidCEP = (cep: string): boolean => {
  const cepRegex = /^\d{5}-?\d{3}$/;
  return cepRegex.test(cep);
};

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

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
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
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
  // Separar dados da empresa e do endereço
  const { address, ...companyData } = req.body;

  // Validação dos dados da empresa
  if (!companyData.name || !companyData.email) {
    return res.status(400).json({ message: "Nome e email da empresa são obrigatórios" });
  }
  if (!isValidEmail(companyData.email)) {
    return res.status(400).json({ message: "Formato de email inválido." });
  }
  // TODO: Adicionar validação para telefone (companyData.phone)

  // Validação do endereço (se fornecido)
  if (address) {
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.zipCode) {
      return res.status(400).json({ message: "Campos obrigatórios do endereço não fornecidos (rua, número, bairro, cidade, estado, CEP)" });
    }
    if (!isValidCEP(address.zipCode)) {
      return res.status(400).json({ message: "Formato de CEP inválido (deve ser XXXXX-XXX ou XXXXXXXX)." });
    }
  }

  try {
    // Passar dados da empresa e do endereço separadamente para o repositório
    const newCompany = await companyRepository.create(companyData, address);
    return res.status(201).json(newCompany);
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  const { address, ...companyData } = req.body;

  // Validar dados da empresa (se fornecidos)
  if (companyData.email && !isValidEmail(companyData.email)) {
    return res.status(400).json({ message: "Formato de email inválido." });
  }
  // TODO: Adicionar validação para telefone (companyData.phone)

  // Validar endereço (se fornecido e não for null)
  if (address && typeof address === 'object') {
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.zipCode) {
      return res.status(400).json({ message: "Campos obrigatórios do endereço não fornecidos para atualização (rua, número, bairro, cidade, estado, CEP)" });
    }
    if (!isValidCEP(address.zipCode)) {
      return res.status(400).json({ message: "Formato de CEP inválido (deve ser XXXXX-XXX ou XXXXXXXX)." });
    }
  } else if (address !== undefined && address !== null) {
     // Se address for fornecido mas não for objeto ou null
     return res.status(400).json({ message: "Dados de endereço inválidos. Forneça um objeto ou null." });
  }

  try {
    // Passar dados da empresa e do endereço separadamente para o repositório
    const updatedCompany = await companyRepository.update(id, companyData, address);
    if (!updatedCompany) {
      return res.status(404).json({ message: "Empresa não encontrada para atualização" });
    }
    return res.json(updatedCompany);
  } catch (error) {
    console.error(`Erro ao atualizar empresa ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: "Erro de conflito ao atualizar empresa (possível duplicidade de email)." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Deletar uma empresa
export const deleteCompany = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }

  try {
    const deletedCompany = await companyRepository.delete(id);
    if (!deletedCompany) {
      return res.status(404).json({ message: "Empresa não encontrada para exclusão" });
    }
    return res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
  } catch (error) {
    console.error(`Erro ao deletar empresa ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return res.status(409).json({ message: "Não é possível excluir a empresa pois existem registros associados (ex: profissionais, serviços)." });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
