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
exports.getCompanyAddress = exports.upsertCompanyAddress = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create or update company address (Company has only one address - unique companyId)
const upsertCompanyAddress = (companyId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.companyAddress.upsert({
        where: { companyId: companyId }, // Unique constraint
        update: data,
        create: Object.assign(Object.assign({}, data), { companyId: companyId }),
    });
});
exports.upsertCompanyAddress = upsertCompanyAddress;
// Get company address
const getCompanyAddress = (companyId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.companyAddress.findUnique({
        where: { companyId: companyId },
    });
});
exports.getCompanyAddress = getCompanyAddress;
// Delete company address (Optional, maybe not needed if address is required?)
// If needed, implement similarly, checking ownership/permissions before deleting.
// export const deleteCompanyAddress = async (companyId: string): Promise<CompanyAddress | null> => {
//   // Add permission checks if necessary
//   return prisma.companyAddress.delete({
//     where: { companyId: companyId },
//   });
// };
