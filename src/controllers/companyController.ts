import { Request, Response, NextFunction } from "express";
import { companyRepository } from "../repositories/companyRepository";
import { Prisma } from "@prisma/client";

// Obter todas as empresas
export const getAllCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companies = await companyRepository.getAll();
    res.json(companies);
  } catch (error) {
    next(error); // Passa o erro para o middleware global
  }
};

// Obter uma empresa específica pelo ID
export const getCompanyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // A validação do formato do ID será feita pelo express-validator
  try {
    const company = await companyRepository.findById(id);
    if (!company) {
      // Lança um erro que será capturado pelo middleware global
      const error: any = new Error("Empresa não encontrada");
      error.statusCode = 404;
      return next(error);
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

// Criar uma nova empresa
export const createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // A validação dos dados (empresa e endereço) será feita pelo express-validator
  const { address, ...companyData } = req.body;

  try {
    // Passar dados da empresa e do endereço separadamente para o repositório
    const newCompany = await companyRepository.create(companyData, address);
    res.status(201).json(newCompany);
  } catch (error) {
    // Erros, incluindo P2002 (duplicidade), serão tratados pelo middleware global
    next(error);
  }
};

// Atualizar uma empresa existente
export const updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // A validação do formato do ID e dos dados do body será feita pelo express-validator
  const { address, ...companyData } = req.body;

  try {
    // Passar dados da empresa e do endereço separadamente para o repositório
    const updatedCompany = await companyRepository.update(id, companyData, address);
    // O repositório deve lançar um erro se a empresa não for encontrada (Prisma P2025)
    // que será tratado pelo middleware global
    res.json(updatedCompany);
  } catch (error) {
    // Erros, incluindo P2025 (não encontrado) ou P2002 (duplicidade), serão tratados pelo middleware global
    next(error);
  }
};

// Deletar uma empresa
export const deleteCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // A validação do formato do ID será feita pelo express-validator

  try {
    const deletedCompany = await companyRepository.delete(id);
    // O repositório deve lançar um erro se a empresa não for encontrada (Prisma P2025)
    // que será tratado pelo middleware global
    res.status(200).json({ message: "Empresa excluída com sucesso", company: deletedCompany });
  } catch (error) {
    // Erros, incluindo P2025 (não encontrado) ou P2003 (restrição FK), serão tratados pelo middleware global
    next(error);
  }
};

