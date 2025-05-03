import { PrismaClient, Company, Prisma } from "@prisma/client";

class CompanyRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Implemented findMany to support filtering, ordering, and pagination
  async findMany(
    filters: Prisma.CompanyWhereInput,
    orderBy: Prisma.CompanyOrderByWithRelationInput,
    skip: number,
    take: number
  ): Promise<Company[]> {
    return this.prisma.company.findMany({
      where: filters,
      orderBy: orderBy,
      skip: skip,
      take: take,
      include: { address: true }, // Include CompanyAddress
    });
  }

  // Implemented count to support filtering
  async count(filters: Prisma.CompanyWhereInput): Promise<number> {
    return this.prisma.company.count({
      where: filters,
    });
  }

  // Keep existing findAll for basic pagination without filters
  async findAll(page: number, limit: number): Promise<{ companies: Company[], total: number }> {
    const skip = (page - 1) * limit;
    const [companies, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        skip: skip,
        take: limit,
        include: { address: true }, // Include CompanyAddress
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.company.count(), // Count without filters for total
    ]);
    return { companies, total };
  }

  async findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        address: true, // Include CompanyAddress
        services: true,
        professionals: true,
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }, // Include user details in reviews
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  // Use CompanyAddress types for addressData
  async create(data: Prisma.CompanyCreateInput, addressData?: Prisma.CompanyAddressCreateWithoutCompanyInput): Promise<Company> {
    return this.prisma.company.create({
      data: {
        ...data,
        address: addressData
          ? {
              create: addressData, // Use CompanyAddressCreateWithoutCompanyInput
            }
          : undefined,
      },
      include: { address: true }, // Include CompanyAddress
    });
  }

  // Use CompanyAddress types for addressData
  async update(id: string, data: Prisma.CompanyUpdateInput, addressData?: Prisma.CompanyAddressUpdateWithoutCompanyInput | Prisma.CompanyAddressCreateWithoutCompanyInput | null): Promise<Company> {
    return this.prisma.company.update({
      where: { id },
      data: {
        ...data,
        address: addressData === null // Handle explicit null to disconnect/delete address if needed
          ? { delete: true } // Or { disconnect: true } depending on desired behavior
          : addressData
          ? {
              upsert: { // Use upsert for simplicity: create if not exists, update if exists
                create: addressData as Prisma.CompanyAddressCreateWithoutCompanyInput, // Correct type
                update: addressData as Prisma.CompanyAddressUpdateWithoutCompanyInput, // Correct type
              },
            }
          : undefined,
      },
      include: { address: true }, // Include CompanyAddress
    });
  }

  async delete(id: string): Promise<Company> {
    // Consider transaction if related data needs cleanup
    return this.prisma.company.delete({
      where: { id },
    });
  }

  // Add other methods as needed (e.g., search, filter by category)
}

export default new CompanyRepository();

