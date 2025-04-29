import { Request, Response } from 'express';
import { companyRepository } from '../repositories/companyRepository';
import { Prisma } from '@prisma/client';

// Obter todas as empresas
export const getAllCompanies = async (req: Request, res: Response): Promise<Response> => {
  try {
    const companies = await companyRepository.getAll();
    return res.json(companies);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter uma empresa específica pelo ID
export const getCompanyById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  try {
    // Usar o método do repositório que inclui as relações
    const company = await companyRepository.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    return res.json(company);
  } catch (error) {
    console.error(`Erro ao buscar empresa ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Criar uma nova empresa
export const createCompany = async (req: Request, res: Response): Promise<Response> => {
  // A criação de relações (Address, Services, Professionals) precisa ser tratada.
  // Por enquanto, focamos na criação da empresa básica.
  const { address, services, professionals, reviews, ...companyData }: Prisma.CompanyCreateInput = req.body;

  // Validação básica
  if (!companyData.name || !companyData.description) {
    return res.status(400).json({ message: 'Nome e descrição são obrigatórios' });
  }

  try {
    // Criar a empresa básica primeiro
    const newCompany = await companyRepository.create(companyData);

    // TODO: Implementar lógica para criar/conectar Address, Services, Professionals após criar a empresa.
    // Exemplo para Address (se enviado no body):
    // if (address) {
    //   await prisma.address.create({ data: { ...address, companyId: newCompany.id } });
    // }

    // Recarregar a empresa com as relações (se a lógica de criação de relações for implementada)
    const companyWithRelations = await companyRepository.findById(newCompany.id);

    return res.status(201).json(companyWithRelations || newCompany);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar uma empresa existente
export const updateCompany = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { address, services, professionals, reviews, ...companyData }: Prisma.CompanyUpdateInput = req.body;

  try {
    // Atualizar dados básicos da empresa
    const updatedCompany = await companyRepository.update(id, companyData);

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Empresa não encontrada para atualização' });
    }

    // TODO: Implementar lógica para atualizar/conectar Address, Services, Professionals.

    // Recarregar a empresa com as relações atualizadas
    const companyWithRelations = await companyRepository.findById(updatedCompany.id);

    return res.json(companyWithRelations || updatedCompany);
  } catch (error) {
    console.error(`Erro ao atualizar empresa ${id}:`, error);
    // Verificar erros específicos do Prisma (ex: registro não encontrado para atualização)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ message: 'Empresa não encontrada para atualização.' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Deletar uma empresa
export const deleteCompany = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    const deletedCompany = await companyRepository.delete(id);
    if (!deletedCompany) {
      return res.status(404).json({ message: 'Empresa não encontrada para exclusão' });
    }
    return res.status(200).json({ message: 'Empresa excluída com sucesso', company: deletedCompany });
  } catch (error) {
    console.error(`Erro ao deletar empresa ${id}:`, error);
    // Verificar erros específicos do Prisma (ex: registro não encontrado para exclusão)
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ message: 'Empresa não encontrada para exclusão.' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
