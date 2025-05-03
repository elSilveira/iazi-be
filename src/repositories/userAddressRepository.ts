import { PrismaClient, UserAddress } from "@prisma/client"; // Correct import: Use UserAddress type
import { Prisma } from "@prisma/client"; // Import Prisma namespace for input types

const prisma = new PrismaClient();

// Use Prisma generated types for input data (UserAddressUncheckedCreateInput)
export const createUserAddress = async (userId: string, data: Omit<Prisma.UserAddressUncheckedCreateInput, "userId" | "id" | "createdAt" | "updatedAt">): Promise<UserAddress> => {
  // Ensure userId is part of the data for unchecked create
  const dataWithUser = { ...data, userId: userId };

  // If setting this address as primary, unset others for the same user
  if (dataWithUser.isPrimary) {
    await prisma.userAddress.updateMany({ // Use prisma.userAddress
      where: { userId: userId, isPrimary: true },
      data: { isPrimary: false },
    });
  }
  return prisma.userAddress.create({ // Use prisma.userAddress
    data: dataWithUser,
  });
};

export const getUserAddresses = async (userId: string): Promise<UserAddress[]> => {
  return prisma.userAddress.findMany({ // Use prisma.userAddress
    where: { userId: userId }, // Filter by userId
    orderBy: { isPrimary: "desc", createdAt: "desc" }, // Order by isPrimary, then createdAt
  });
};

export const getUserAddressById = async (userId: string, addressId: string): Promise<UserAddress | null> => {
  // Use findFirst with a compound filter as {id, userId} is not unique by default
  return prisma.userAddress.findFirst({ // Use prisma.userAddress
    where: { id: addressId, userId: userId }, // Ensure address belongs to the user
  });
};

// Use Prisma generated types for update data (UserAddressUpdateInput)
export const updateUserAddress = async (userId: string, addressId: string, data: Prisma.UserAddressUpdateInput): Promise<UserAddress | null> => {
  // If setting this address as primary, unset others for the same user
  if (typeof data.isPrimary === "boolean" && data.isPrimary === true) {
    await prisma.userAddress.updateMany({ // Use prisma.userAddress
      where: { userId: userId, isPrimary: true, id: { not: addressId } }, // Exclude the current address
      data: { isPrimary: false },
    });
  }

  // Ensure the address belongs to the user before updating
  const existingAddress = await prisma.userAddress.findFirst({ // Use findFirst to check ownership
    where: { id: addressId, userId: userId },
  });

  if (!existingAddress) {
    return null; // Or throw an error
  }

  return prisma.userAddress.update({ // Use prisma.userAddress
    where: { id: addressId }, // Update by ID
    data: data,
  });
};

export const deleteUserAddress = async (userId: string, addressId: string): Promise<UserAddress | null> => {
  // Ensure the address belongs to the user before deleting
  const existingAddress = await prisma.userAddress.findFirst({ // Use findFirst to check ownership
    where: { id: addressId, userId: userId },
  });

  if (!existingAddress) {
    return null; // Or throw an error
  }

  return prisma.userAddress.delete({ // Use prisma.userAddress
    where: { id: addressId }, // Delete by ID
  });
};

