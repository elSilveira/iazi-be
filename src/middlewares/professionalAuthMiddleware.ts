import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

export const checkProfessionalOwnerOrAdminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError("Usuário não autenticado."));
    }

    const professionalId = req.params.id;
    const loggedInUserId = req.user.id;
    const loggedInUserRole = req.user.role;

    // Se o usuário for ADMIN, permitir acesso
    if (loggedInUserRole === UserRole.ADMIN) {
      return next();
    }

    // Se não for ADMIN, verificar se é o dono do perfil profissional
    if (!professionalId) {
        return next(new ForbiddenError("ID do profissional não fornecido na rota."));
    }

    const professionalProfile = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { userId: true, companyId: true } // Seleciona userId e companyId para futuras verificações se necessário
    });

    if (!professionalProfile) {
      res.status(404).json({ message: "Perfil profissional não encontrado." });
      return;
    }

    // Verifica se o usuário logado é o dono do perfil profissional
    if (professionalProfile.userId === loggedInUserId) {
      return next();
    }
    
    // // Opcional: Verificar se o usuário é dono da empresa à qual o profissional pertence (se aplicável e se companyId estiver presente)
    // // Esta lógica pode ser adicionada se a regra de negócio exigir que o dono da empresa possa editar perfis de seus profissionais.
    // // Atualmente, o checkAdminOrCompanyOwnerMiddleware já cobria o "CompanyOwner", mas aqui focamos no "ProfessionalOwner".
    // if (professionalProfile.companyId && req.user.role === UserRole.COMPANY_OWNER) { // Supondo que COMPANY_OWNER seja um role
    //   const company = await prisma.company.findUnique({
    //     where: { id: professionalProfile.companyId },
    //     select: { ownerId: true }
    //   });
    //   if (company && company.ownerId === loggedInUserId) {
    //     return next();
    //   }
    // }

    // Se não for ADMIN nem o dono do perfil
    return next(new ForbiddenError("Acesso negado. Você só pode editar seu próprio perfil profissional."));

  } catch (error) {
    console.error("Erro no middleware de autorização do profissional:", error);
    next(new ForbiddenError("Erro de autorização ao acessar o perfil profissional."));
  }
};

