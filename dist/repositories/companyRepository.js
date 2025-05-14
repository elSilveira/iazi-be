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
const client_1 = require("@prisma/client");
class CompanyRepository {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    // Implemented findMany to support filtering, ordering, and pagination
    findMany(filters, orderBy, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.company.findMany({
                where: filters,
                orderBy: orderBy,
                skip: skip,
                take: take, // Include complete company data with services and professionals
                include: {
                    address: true, // Include full address data
                    services: {
                        include: {
                            category: true
                        }
                    },
                    professionals: {
                        include: {
                            services: {
                                include: {
                                    service: true
                                }
                            }
                        }
                    }
                },
            });
        });
    }
    // Implemented count to support filtering
    count(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.company.count({
                where: filters,
            });
        });
    }
    // Keep existing findAll for basic pagination without filters
    findAll(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = (page - 1) * limit;
            const [companies, total] = yield this.prisma.$transaction([
                this.prisma.company.findMany({
                    skip: skip,
                    take: limit,
                    // Select only necessary fields for the list view
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        rating: true,
                        totalReviews: true,
                        address: {
                            select: {
                                city: true,
                                state: true,
                            }
                        },
                        categories: true,
                    },
                    orderBy: { updatedAt: "desc" },
                }),
                this.prisma.company.count(), // Count without filters for total
            ]);
            return { companies, total };
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.company.findUnique({
                where: { id },
                include: {
                    address: true, // Include full CompanyAddress for detail view
                    services: { select: { id: true, name: true, price: true, duration: true } }, // Select specific service fields
                    professionals: { select: { id: true, name: true, role: true, image: true } }, // Select specific professional fields
                    reviews: {
                        include: {
                            user: { select: { id: true, name: true, avatar: true } }, // Include user details in reviews
                        },
                        orderBy: { updatedAt: "desc" },
                    },
                },
            });
        });
    }
    // Use CompanyAddress types for addressData
    create(data, addressData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.company.create({
                data: Object.assign(Object.assign({}, data), { address: addressData
                        ? {
                            create: addressData, // Use CompanyAddressCreateWithoutCompanyInput
                        }
                        : undefined }),
                include: { address: true }, // Include CompanyAddress on create/update result
            });
        });
    }
    // Use CompanyAddress types for addressData
    update(id, data, addressData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.company.update({
                where: { id },
                data: Object.assign(Object.assign({}, data), { address: addressData === null // Handle explicit null to disconnect/delete address if needed
                        ? { delete: true } // Or { disconnect: true } depending on desired behavior
                        : addressData
                            ? {
                                upsert: {
                                    create: addressData, // Correct type
                                    update: addressData, // Correct type
                                },
                            }
                            : undefined }),
                include: { address: true }, // Include CompanyAddress on create/update result
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Consider transaction if related data needs cleanup
            return this.prisma.company.delete({
                where: { id },
            });
        });
    }
}
exports.default = new CompanyRepository();
