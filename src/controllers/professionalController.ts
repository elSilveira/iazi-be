// professionalController.ts
import { Request, Response, NextFunction } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma, UserRole } from "@prisma/client";

interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

export const getAllProfessionalsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { 
    companyId, q, role, serviceId, city, state, minRating, sort, page = "1", limit = "10"
  } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    res.status(400).json({ message: "Parâmetros de paginação inválidos (page e limit devem ser números positivos)." });
    return;
  }
  const skip = (pageNum - 1) * limitNum;
  try {
    const filters: Prisma.ProfessionalWhereInput = {};
    if (companyId && typeof companyId === 'string' && isValidUUID(companyId)) filters.companyId = companyId;
    if (role) filters.role = { contains: role as string, mode: "insensitive" };
    if (serviceId && typeof serviceId === 'string' && isValidUUID(serviceId)) {
      filters.services = { some: { serviceId: serviceId } };
    }
    if (q) {
      const searchTerm = q as string;
      filters.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { role: { contains: searchTerm, mode: "insensitive" } },
        { company: { name: { contains: searchTerm, mode: "insensitive" } } },
        { services: { some: { service: { name: { contains: searchTerm, mode: "insensitive" } } } } },
      ];
    }
    const companyFilter: Prisma.CompanyWhereInput = {};
    const addressFilter: Prisma.CompanyAddressWhereInput = {}; 
    if (city) addressFilter.city = { contains: city as string, mode: "insensitive" };
    if (state) addressFilter.state = { contains: state as string, mode: "insensitive" };
    if (Object.keys(addressFilter).length > 0) {
        companyFilter.address = addressFilter;
        filters.company = companyFilter;
    }
    if (minRating) {
      const ratingNum = parseFloat(minRating as string);
      if (!isNaN(ratingNum)) filters.rating = { gte: ratingNum };
    }
    let orderBy: Prisma.ProfessionalOrderByWithRelationInput = { name: "asc" };
    switch (sort as string) {
      case "rating_desc": orderBy = { rating: "desc" }; break;
      case "name_asc": orderBy = { name: "asc" }; break;
    }
    const professionals = await professionalRepository.findMany(filters, orderBy, skip, limitNum);
    const totalProfessionals = await professionalRepository.count(filters);
    res.json({
      data: professionals,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalProfessionals / limitNum),
        totalItems: totalProfessionals,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    next(error); 
  }
};

export const getProfessionalByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  try {
    const professional = await professionalRepository.findById(id);
    if (!professional) {
      res.status(404).json({ message: "Profissional não encontrado" });
      return;
    }
    res.json(professional);
  } catch (error) {
    console.error(`Erro ao buscar profissional ${id}:`, error);
    next(error);
  }
};

export const createProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
        name, role, image, coverImage, bio, phone, companyId,
        experiences, educations, services, availability, portfolioItems
    } = req.body;
    const authUser = req.user as AuthenticatedUser;

    if (!authUser || !authUser.id) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    if (!name) {
      res.status(400).json({ message: "Nome do profissional não fornecido." });
      return;
    }
    try {
      const dataToCreate: Prisma.ProfessionalCreateInput = {
        name,
        role,
        image, // imagem de perfil
        coverImage, // imagem de capa
        bio,
        phone,
        user: { connect: { id: authUser.id } },
        ...(companyId && isValidUUID(companyId) ? { company: { connect: { id: companyId } } } : {})
      };
      // Map services to serviceIds
      const serviceIds = Array.isArray(services) ? services.map((s: any) => s.serviceId) : (services === undefined ? undefined : []);
      // Map experiences
      const experiencesData = Array.isArray(experiences) ? experiences.map((exp: any) => ({
        title: exp.title,
        companyName: exp.companyName,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
      })) : (experiences === undefined ? undefined : []);
      // Map educations
      const educationsData = Array.isArray(educations) ? educations.map((edu: any) => ({
        institution: edu.institutionName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: edu.description,
      })) : (educations === undefined ? undefined : []);
      // Map availability
      const availabilityData = Array.isArray(availability) ? availability.map((a: any) => ({
        dayOfWeek: a.day_of_week,
        startTime: a.start_time,
        endTime: a.end_time,
      })) : (availability === undefined ? undefined : []);
      // Map portfolio
      const portfolioData = Array.isArray(portfolioItems) ? portfolioItems.map((p: any) => ({
        imageUrl: p.imageUrl,
        description: p.description,
      })) : (portfolioItems === undefined ? undefined : []);
      const newProfessional = await professionalRepository.create(
          dataToCreate,
          serviceIds,
          experiencesData,
          educationsData,
          availabilityData,
          portfolioData
      );
      res.status(201).json(newProfessional);
    } catch (error) {
      console.error("Erro ao criar profissional:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: "Este usuário já possui um perfil profissional ou ocorreu um conflito de dados (ex: nome duplicado se houver restrição)." });
            return;
        }
        if (error.code === 'P2025') {
          res.status(400).json({ message: `Erro ao conectar: ${error.meta?.cause || 'Registro relacionado não encontrado (ex: Empresa ou Usuário não existe)'}` });
          return;
        }
      }
      next(error);
    }
};

export const updateProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const {
        name, role, image, coverImage, bio, phone, companyId,
        experiences, educations, services, availability, portfolioItems,
        avatar, // ignorar se vier
        ...dataToUpdateFromRequest
    } = req.body;
    const authUser = req.user as AuthenticatedUser;
    if (!authUser || !authUser.id) {
        res.status(401).json({ message: "Usuário não autenticado." });
        return;
    }
    try {
      const professionalToUpdate = await professionalRepository.findById(id);
      if (!professionalToUpdate) {
        res.status(404).json({ message: "Perfil profissional não encontrado." });
        return;
      }
      if (professionalToUpdate.userId !== authUser.id && authUser.role !== 'ADMIN' && authUser.role !== 'COMPANY_OWNER') {
          // Permissão
      }
      const updatePayload: Prisma.ProfessionalUpdateInput = {
        ...dataToUpdateFromRequest,
        name,
        role,
        image,
        coverImage,
        bio,
        phone,
      };
      if ('companyId' in updatePayload) delete (updatePayload as any).companyId;
      if ('userId' in updatePayload) delete (updatePayload as any).userId;
      if ('avatar' in updatePayload) delete (updatePayload as any).avatar;
      // Map services to serviceIds
      const serviceIds = Array.isArray(services) ? services.map((s: any) => s.serviceId) : undefined;
      // Map experiences
      const experiencesData = Array.isArray(experiences) ? experiences.map((exp: any) => ({
        title: exp.title,
        companyName: exp.companyName,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
      })) : undefined;
      // Map educations
      const educationsData = Array.isArray(educations) ? educations.map((edu: any) => ({
        institution: edu.institutionName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: edu.description,
      })) : undefined;
      // Map availability
      const availabilityData = Array.isArray(availability) ? availability.map((a: any) => ({
        dayOfWeek: a.day_of_week,
        startTime: a.start_time,
        endTime: a.end_time,
      })) : undefined;
      // Map portfolio
      const portfolioData = Array.isArray(portfolioItems) ? portfolioItems.map((p: any) => ({
        imageUrl: p.imageUrl,
        description: p.description,
      })) : undefined;
      const updatedProfessional = await professionalRepository.update(
          id,
          updatePayload,
          serviceIds,
          experiencesData,
          educationsData,
          availabilityData,
          portfolioData
      );
      res.json(updatedProfessional);
    } catch (error) {
      console.error(`Erro ao atualizar profissional ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ message: `Erro ao atualizar: ${error.meta?.cause || 'Profissional não encontrado ou registro relacionado ausente'}` });
          return;
      }
      next(error);
    }
};

export const deleteProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    try {
      await professionalRepository.delete(id); 
      res.status(204).send(); 
    } catch (error) {
      console.error(`Erro ao deletar profissional ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ message: `Erro ao deletar: ${error.meta?.cause || 'Profissional não encontrado'}` });
          return;
      }
      next(error);
    }
};

// Placeholder for future implementation if needed
export const addServiceToProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { professionalId, serviceId } = req.params;
    res.status(501).json({ message: "Not Implemented" });
    return;
};

export const removeServiceFromProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { professionalId, serviceId } = req.params;
    res.status(501).json({ message: "Not Implemented" });
    return;
};

export const getMyProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authUser = req.user as AuthenticatedUser;
  if (!authUser || !authUser.id) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }
  try {
    const professional = await professionalRepository.findByUserId(authUser.id);
    if (!professional) {
      res.status(404).json({ message: "Perfil profissional não encontrado para este usuário." });
      return;
    }
    res.json(professional);
  } catch (error) {
    next(error);
  }
};

