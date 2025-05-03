import { PrismaClient, CompanyAddress } from "@prisma/client";
import { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Create or update company address (Company has only one address - unique companyId)
export const upsertCompanyAddress = async (companyId: string, data: Omit<Prisma.CompanyAddressUncheckedCreateInput, "companyId" | "id" | "createdAt" | "updatedAt">): Promise<CompanyAddress> => {
  return prisma.companyAddress.upsert({
    where: { companyId: companyId }, // Unique constraint
    update: data,
    create: { ...data, companyId: companyId },
  });
};

// Get company address
export const getCompanyAddress = async (companyId: string): Promise<CompanyAddress | null> => {
  return prisma.companyAddress.findUnique({
    where: { companyId: companyId },
  });
};

// Delete company address (Optional, maybe not needed if address is required?)
// If needed, implement similarly, checking ownership/permissions before deleting.
// export const deleteCompanyAddress = async (companyId: string): Promise<CompanyAddress | null> => {
//   // Add permission checks if necessary
//   return prisma.companyAddress.delete({
//     where: { companyId: companyId },
//   });
// };

