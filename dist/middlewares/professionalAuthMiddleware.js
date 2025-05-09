"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProfessionalOwnerOrAdminMiddleware = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const errors_1 = require("../lib/errors");
const checkProfessionalOwnerOrAdminMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError("Usuário não autenticado."));
        }
        const professionalId = req.params.id;
        const loggedInUserId = req.user.id;
        const loggedInUserRole = req.user.role;
        // Se o usuário for ADMIN, permitir acesso
        if (loggedInUserRole === client_1.UserRole.ADMIN) {
            return next();
        }
        // Se não for ADMIN, verificar se é o dono do perfil profissional
        if (!professionalId) {
            return next(new errors_1.ForbiddenError("ID do profissional não fornecido na rota."));
        }
        const professionalProfile = yield prisma_1.prisma.professional.findUnique({
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
        return next(new errors_1.ForbiddenError("Acesso negado. Você só pode editar seu próprio perfil profissional."));
    }
    catch (error) {
        console.error("Erro no middleware de autorização do profissional:", error);
        next(new errors_1.ForbiddenError("Erro de autorização ao acessar o perfil profissional."));
    }
});
exports.checkProfessionalOwnerOrAdminMiddleware = checkProfessionalOwnerOrAdminMiddleware;
