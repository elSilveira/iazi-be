// professionalController.ts
import { Request, Response, NextFunction } from "express";
import { professionalRepository } from "../repositories/professionalRepository";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

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

// Helper to parse YYYY-MM or YYYY-MM-DD to Date (UTC, first day of month if day missing)
function parseToDateOrKeepUndefined(input?: string): Date | string {
  if (!input) return new Date('1970-01-01T00:00:00.000Z'); // fallback to epoch (never null/undefined)
  if (/^\d{4}-\d{2}$/.test(input)) {
    return new Date(input + '-01T00:00:00.000Z');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(input + 'T00:00:00.000Z');
  }
  // If already a Date or ISO string, just return
  return input;
}

// Helper to normalize education/educations to always return 'educations' as array
function normalizeEducations(professional: any) {
  if (Array.isArray(professional.educations)) return professional.educations;
  if (Array.isArray(professional.education)) return professional.education;
  return [];
}

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
    const educations = normalizeEducations(professional);
    // Map services to always include service name
    const services = (professional.services || []).map((ps: any) => {
      if (ps.service) {
        return { ...ps, name: ps.service.name, ...ps.service };
      }
      return ps;
    });
    res.json({ ...professional, services, educations });
  } catch (error) {
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
        startDate: parseToDateOrKeepUndefined(exp.startDate),
        endDate: parseToDateOrKeepUndefined(exp.endDate),
        description: exp.description,
      })) : (experiences === undefined ? undefined : []);
      // Map educations
      const educationsData = Array.isArray(educations) ? educations.map((edu: any) => ({
        institution: edu.institutionName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: parseToDateOrKeepUndefined(edu.startDate),
        endDate: parseToDateOrKeepUndefined(edu.endDate),
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

      // ATOMIC: Create professional and update user role in the same transaction
      const { prisma } = require("../lib/prisma");
      const newProfessional = await prisma.$transaction(async (tx: any) => {
        // Create professional
        const createdProfessional = await tx.professional.create({ data: dataToCreate });
        // Update user role to PROFESSIONAL
        await tx.user.update({
          where: { id: authUser.id },
          data: { role: "PROFESSIONAL" },
        });
        // Create related data (services, experiences, etc.)
        if (serviceIds && serviceIds.length > 0) {
          const serviceConnections = serviceIds.map((serviceId: string) => ({
            professionalId: createdProfessional.id,
            serviceId: serviceId,
          }));
          await tx.professionalService.createMany({
            data: serviceConnections,
            skipDuplicates: true,
          });
        }
        if (experiencesData && experiencesData.length > 0) {
          await tx.professionalExperience.createMany({
            data: experiencesData.map((exp: any) => ({ ...exp, professionalId: createdProfessional.id })),
          });
        }
        if (educationsData && educationsData.length > 0) {
          await tx.professionalEducation.createMany({
            data: educationsData.map((edu: any) => ({ ...edu, professionalId: createdProfessional.id })),
          });
        }
        if (availabilityData && availabilityData.length > 0) {
          await tx.professionalAvailabilitySlot.createMany({
            data: availabilityData.map((slot: any) => ({ ...slot, professionalId: createdProfessional.id })),
          });
        }
        if (portfolioData && portfolioData.length > 0) {
          await tx.professionalPortfolioItem.createMany({
            data: portfolioData.map((item: any) => ({ ...item, professionalId: createdProfessional.id })),
          });
        }
        // Return the full professional with details
        return tx.professional.findUniqueOrThrow({
          where: { id: createdProfessional.id },
          include: professionalRepository.includeDetails,
        });
      });
      res.status(201).json({ ...newProfessional, educations: normalizeEducations(newProfessional) });
    } catch (error) {
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
        startDate: parseToDateOrKeepUndefined(exp.startDate),
        endDate: parseToDateOrKeepUndefined(exp.endDate),
        description: exp.description,
      })) : undefined;
      // Map educations
      const educationsData = Array.isArray(educations) ? educations.map((edu: any) => ({
        institution: edu.institutionName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: parseToDateOrKeepUndefined(edu.startDate),
        endDate: parseToDateOrKeepUndefined(edu.endDate),
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
      res.json({ ...updatedProfessional, educations: normalizeEducations(updatedProfessional) });
    } catch (error) {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ message: `Erro ao deletar: ${error.meta?.cause || 'Profissional não encontrado'}` });
          return;
      }
      next(error);
    }
};

export const addServiceToProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { professionalId } = req.params;
    const { serviceId } = req.body;
    if (!isValidUUID(professionalId) || !isValidUUID(serviceId)) {
        res.status(400).json({ message: "IDs inválidos." });
        return;
    }
    try {
        // Check if professional exists
        const professional = await professionalRepository.findById(professionalId);
        if (!professional) {
            res.status(404).json({ message: "Profissional não encontrado." });
            return;
        }
        // Check if service exists
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            res.status(404).json({ message: "Serviço não encontrado." });
            return;
        }
        // Link professional to service (ignore duplicate error)
        try {
            await require("../repositories/serviceRepository").serviceRepository.linkProfessionalToService(professionalId, serviceId);
        } catch (err: any) {
            if (err.code !== 'P2002') throw err; // Ignore duplicate
        }
        // Return updated professional with pluralized arrays
        const updatedProfessional = await professionalRepository.findById(professionalId);
        if (!updatedProfessional) {
            res.status(404).json({ message: "Profissional não encontrado após associação." });
            return;
        }
        const flatServices = (updatedProfessional.services || []).map((ps: any) => ps.service);
        const educations = normalizeEducations(updatedProfessional);
        res.status(201).json({ ...updatedProfessional, services: flatServices, educations });
    } catch (error) {
        next(error);
    }
};

export const removeServiceFromProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { professionalId, serviceId } = req.params;
    if (!isValidUUID(professionalId) || !isValidUUID(serviceId)) {
        res.status(400).json({ message: "IDs inválidos." });
        return;
    }
    try {
        // Check if professional exists
        const professional = await professionalRepository.findById(professionalId);
        if (!professional) {
            res.status(404).json({ message: "Profissional não encontrado." });
            return;
        }
        // Check if service exists
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            res.status(404).json({ message: "Serviço não encontrado." });
            return;
        }
        // Unlink professional from service
        await require("../repositories/serviceRepository").serviceRepository.unlinkProfessionalFromService(professionalId, serviceId);
        // Return updated professional with pluralized arrays
        const updatedProfessional = await professionalRepository.findById(professionalId);
        if (!updatedProfessional) {
            res.status(404).json({ message: "Profissional não encontrado após desassociação." });
            return;
        }
        const flatServices = (updatedProfessional.services || []).map((ps: any) => ps.service);
        const educations = normalizeEducations(updatedProfessional);
        res.status(200).json({ ...updatedProfessional, services: flatServices, educations, message: "Serviço desassociado com sucesso" });
    } catch (error) {
        // If not found, return 404
        if ((error as any)?.code === 'P2025') {
            res.status(404).json({ message: "Associação não encontrada." });
            return;
        }
        next(error);
    }
};

export const getMyProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }
    const professional = await professionalRepository.findByUserId(userId);
    if (!professional) {
      res.status(404).json({ message: "Perfil profissional não encontrado." });
      return;
    }
    // Map the join table to a flat array of service objects
    const flatServices = (professional.services || []).map((ps: any) => ps.service);

    // Always return 'educations' (plural) for array
    const educations = normalizeEducations(professional);

    // Determine userRole based on professional/company presence
    let userRole = 'USER';
    if (professional.companyId) {
      userRole = 'COMPANY';
    } else if (professional.id) {
      userRole = 'PROFESSIONAL';
    }

    res.json({ ...professional, services: flatServices, educations, userRole });
  } catch (error) {
    next(error);
  }
};

// GET /api/professionals/services - List all services for the authenticated professional (with join fields)
export const getMyProfessionalServicesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }
    // Find the professional profile for this user
    const professional = await professionalRepository.findByUserId(userId);
    if (!professional) {
      res.status(404).json({ message: "Perfil profissional não encontrado." });
      return;
    }
    // Get all services linked to this professional (with join fields)
    const services = await require("../repositories/serviceRepository").serviceRepository.getServicesByProfessional(professional.id);
    res.json(services.map((ps: any) => ({
      ...ps.service,
      price: ps.price,
      schedule: ps.schedule,
      description: ps.description
    })));
  } catch (error) {
    next(error);
  }
};

export const updateMyProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authUser = req.user as AuthenticatedUser;
  if (!authUser || !authUser.id) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }
  try {
    // Find professional profile by userId
    const professional = await professionalRepository.findByUserId(authUser.id);
    if (!professional) {
      res.status(404).json({ message: "Perfil profissional não encontrado." });
      return;
    }
    // Only allow owner or admin
    if (professional.userId !== authUser.id && authUser.role !== 'ADMIN' && authUser.role !== 'COMPANY_OWNER') {
      res.status(403).json({ message: "Acesso negado." });
      return;
    }
    // Use the same update logic as updateProfessionalHandler
    const {
      name, role, image, coverImage, bio, phone, companyId,
      experiences, educations, services, availability, portfolioItems,
      avatar, // ignorar se vier
      ...dataToUpdateFromRequest
    } = req.body;
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
    const serviceIds = req.body.hasOwnProperty('services') ? (Array.isArray(services) ? services.map((s: any) => s.serviceId) : []) : undefined;
    // Map experiences
    const experiencesData = req.body.hasOwnProperty('experiences') ? (Array.isArray(experiences) ? experiences.map((exp: any) => ({
      title: exp.title,
      companyName: exp.companyName,
      startDate: parseToDateOrKeepUndefined(exp.startDate),
      endDate: parseToDateOrKeepUndefined(exp.endDate),
      description: exp.description,
    })) : []) : undefined;
    // Map educations
    const educationsData = req.body.hasOwnProperty('educations') ? (Array.isArray(educations) ? educations.map((edu: any) => ({
      institution: edu.institutionName,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: parseToDateOrKeepUndefined(edu.startDate),
      endDate: parseToDateOrKeepUndefined(edu.endDate),
      description: edu.description,
    })) : []) : undefined;
    // Map availability
    const availabilityData = req.body.hasOwnProperty('availability') ? (Array.isArray(availability) ? availability.map((a: any) => ({
      dayOfWeek: a.day_of_week,
      startTime: a.start_time,
      endTime: a.end_time,
    })) : []) : undefined;
    // Map portfolio
    const portfolioData = req.body.hasOwnProperty('portfolioItems') ? (Array.isArray(portfolioItems) ? portfolioItems.map((p: any) => ({
      imageUrl: p.imageUrl,
      description: p.description,
    })) : []) : undefined;
    const updatedProfessional = await professionalRepository.update(
      professional.id,
      updatePayload,
      serviceIds,
      experiencesData,
      educationsData,
      availabilityData,
      portfolioData
    );
    // Re-fetch to ensure fresh join data
    const freshProfessional = await professionalRepository.findByUserId(authUser.id);
    if (!freshProfessional) {
      res.status(404).json({ message: "Perfil profissional não encontrado após atualização." });
      return;
    }
    const flatServices = (freshProfessional.services || []).map((ps: any) => ps.service);
    const educationsArr = normalizeEducations(freshProfessional);
    let userRole = 'USER';
    if (freshProfessional.companyId) {
      userRole = 'COMPANY';
    } else if (freshProfessional.id) {
      userRole = 'PROFESSIONAL';
    }
    res.json({ ...freshProfessional, services: flatServices, educations: educationsArr, userRole });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: `Erro ao atualizar: ${error.meta?.cause || 'Profissional não encontrado ou registro relacionado ausente'}` });
      return;
    }
    next(error);
  }
};

// POST /api/professionals/services - Link a service to the authenticated professional (with price, schedule, description)
export const addServiceToMyProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // DEBUG: Log user context and userId
    console.log('DEBUG addServiceToMyProfessionalHandler req.user:', req.user);
    const userId = req.user?.id;
    const { serviceId, price, schedule, description } = req.body;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }
    if (!isValidUUID(serviceId)) {
      res.status(400).json({ message: "serviceId inválido." });
      return;
    }
    if (schedule && !Array.isArray(schedule)) {
      res.status(400).json({ message: "schedule deve ser um array de objetos." });
      return;
    }
    // DEBUG: Log professional lookup
    const professional = await professionalRepository.findByUserId(userId);
    console.log('DEBUG addServiceToMyProfessionalHandler professional:', professional);
    if (!professional) {
      res.status(404).json({ message: "Perfil profissional não encontrado." });
      return;
    }
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      res.status(404).json({ message: "Serviço não encontrado." });
      return;
    }
    try {
      await require("../repositories/serviceRepository").serviceRepository.linkProfessionalToService(professional.id, serviceId, price, schedule, description);
    } catch (err: any) {
      if (err.code !== 'P2002') throw err;
    }
    // Return updated professional (with pluralized arrays)
    const updatedProfessional = await professionalRepository.findByUserId(userId);
    const flatServices = (updatedProfessional?.services || []).map((ps: any) => ps.service);
    const educations = normalizeEducations(updatedProfessional);
    res.status(201).json({ ...updatedProfessional, services: flatServices, educations });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/professionals/services/:serviceId - Unlink a service from the authenticated professional
export const removeServiceFromMyProfessionalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;
    if (!userId || !serviceId) {
      res.status(400).json({ message: "Usuário ou serviceId ausente." });
      return;
    }
    if (!isValidUUID(serviceId)) {
      res.status(400).json({ message: "serviceId inválido." });
      return;
    }
    const professional = await professionalRepository.findByUserId(userId);
    if (!professional) {
      res.status(404).json({ message: "Perfil profissional não encontrado." });
      return;
    }
    await require("../repositories/serviceRepository").serviceRepository.unlinkProfessionalFromService(professional.id, serviceId);
    // Return updated list
    const services = await require("../repositories/serviceRepository").serviceRepository.getServicesByProfessional(professional.id);
    res.status(200).json(services.map((ps: any) => ({
      ...ps.service,
      price: ps.price,
      schedule: ps.schedule,
      description: ps.description
    })));
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ message: "Associação não encontrada." });
      return;
    }
    next(error);
  }
};

// Get services offered by a professional
export const getProfessionalServices = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { professionalId } = req.params;

    if (!isValidUUID(professionalId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "ID do profissional inválido",
          details: [
            {
              field: "professionalId",
              message: "O ID do profissional deve ser um UUID válido"
            }
          ]
        }
      });
    }

    // Check if professional exists
    const professionalExists = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professionalExists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Profissional não encontrado"
        }
      });
    }

    // Get professional services
    const professionalServices = await prisma.professionalService.findMany({
      where: { professionalId },
      include: {
        service: true
      }
    });

    // Format response according to specifications
    const formattedServices = professionalServices.map(ps => {
      return {
        id: ps.service.id,
        name: ps.service.name,
        description: ps.service.description,
        price: ps.price || ps.service.price,
        duration: ps.service.duration,
        isActive: true // Assuming all services are active by default
      };
    });

    return res.json({
      data: formattedServices
    });

  } catch (error) {
    console.error("Error fetching professional services:", error);
    next(error);
  }
};

