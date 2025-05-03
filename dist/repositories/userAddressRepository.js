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
exports.deleteUserAddress = exports.updateUserAddress = exports.getUserAddressById = exports.getUserAddresses = exports.createUserAddress = void 0;
const client_1 = require("@prisma/client"); // Correct import: Use UserAddress type
const prisma = new client_1.PrismaClient();
// Use Prisma generated types for input data (UserAddressUncheckedCreateInput)
const createUserAddress = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure userId is part of the data for unchecked create
    const dataWithUser = Object.assign(Object.assign({}, data), { userId: userId });
    // If setting this address as primary, unset others for the same user
    if (dataWithUser.isPrimary) {
        yield prisma.userAddress.updateMany({
            where: { userId: userId, isPrimary: true },
            data: { isPrimary: false },
        });
    }
    return prisma.userAddress.create({
        data: dataWithUser,
    });
});
exports.createUserAddress = createUserAddress;
const getUserAddresses = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.userAddress.findMany({
        where: { userId: userId }, // Filter by userId
        orderBy: { isPrimary: "desc", createdAt: "desc" }, // Order by isPrimary, then createdAt
    });
});
exports.getUserAddresses = getUserAddresses;
const getUserAddressById = (userId, addressId) => __awaiter(void 0, void 0, void 0, function* () {
    // Use findFirst with a compound filter as {id, userId} is not unique by default
    return prisma.userAddress.findFirst({
        where: { id: addressId, userId: userId }, // Ensure address belongs to the user
    });
});
exports.getUserAddressById = getUserAddressById;
// Use Prisma generated types for update data (UserAddressUpdateInput)
const updateUserAddress = (userId, addressId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // If setting this address as primary, unset others for the same user
    if (typeof data.isPrimary === "boolean" && data.isPrimary === true) {
        yield prisma.userAddress.updateMany({
            where: { userId: userId, isPrimary: true, id: { not: addressId } }, // Exclude the current address
            data: { isPrimary: false },
        });
    }
    // Ensure the address belongs to the user before updating
    const existingAddress = yield prisma.userAddress.findFirst({
        where: { id: addressId, userId: userId },
    });
    if (!existingAddress) {
        return null; // Or throw an error
    }
    return prisma.userAddress.update({
        where: { id: addressId }, // Update by ID
        data: data,
    });
});
exports.updateUserAddress = updateUserAddress;
const deleteUserAddress = (userId, addressId) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure the address belongs to the user before deleting
    const existingAddress = yield prisma.userAddress.findFirst({
        where: { id: addressId, userId: userId },
    });
    if (!existingAddress) {
        return null; // Or throw an error
    }
    return prisma.userAddress.delete({
        where: { id: addressId }, // Delete by ID
    });
});
exports.deleteUserAddress = deleteUserAddress;
