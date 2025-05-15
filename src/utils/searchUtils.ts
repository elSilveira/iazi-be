// searchUtils.ts - Extract transformation logic
import { 
  ProfessionalWithServices, 
  ServiceWithRelations, 
  CompanyWithDetails 
} from '../types/searchTypes';

/**
 * Transform raw professional data into a clean format with services
 */
export function transformProfessional(prof: any): ProfessionalWithServices {
  // Map services with proper category handling and price conversion
  const mappedServices = prof.services?.map((ps: any) => {
    // Get the category from the service if available
    const category = ps.service.category ? {
      id: ps.service.category.id,
      name: ps.service.category.name
    } : undefined;
    
    // Convert Decimal price to number if needed
    const price = typeof ps.price === 'object' ? 
      Number(ps.price.toString()) : 
      (ps.price || (ps.service.price ? Number(ps.service.price.toString()) : undefined));
    
    return {
      id: ps.service.id,
      name: ps.service.name,
      duration: ps.service.duration,
      price: price,
      description: ps.description || ps.service.description,
      category: category,
      multiServiceEnabled: true,
      averageTimeToComplete: ps.service.duration
    };
  }) || [];
  
  // Exclude services property to avoid duplication
  const { services: _, ...profWithoutServices } = prof;
  
  // Return the professional with multi-service support
  return {
    ...profWithoutServices,
    services: mappedServices,
    hasMultiServiceSupport: true
  } as ProfessionalWithServices; // Use type assertion to bypass strict type checking
}

/**
 * Transform raw service data into a clean format with professionals
 */
export function transformService(service: any): ServiceWithRelations {
  // Get the category from categoryId relation
  const category = service.category ? {
    id: service.category.id,
    name: service.category.name
  } : undefined;

  // Transform the professional service relationships
  const transformedProfessionals = service.professionals?.map((ps: any) => {
    // Map other services this professional offers
    const otherServices = ps.professional.services?.map((s: any) => ({
      id: s.service.id,
      name: s.service.name,
      duration: s.service.duration,
      price: typeof s.price === 'object' ? Number(s.price.toString()) : s.price
    })) || [];
    
    return {
      id: ps.professional.id,
      name: ps.professional.name,
      role: ps.professional.role,
      rating: ps.professional.rating,
      image: ps.professional.image,
      price: typeof ps.price === 'object' ? Number(ps.price.toString()) : ps.price,
      company: ps.professional.company,
      hasMultiServiceSupport: true,
      otherServices
    };
  }) || [];

  // Create the enhanced service with multi-service enabled
  return {
    ...service,
    category,
    multiServiceEnabled: true, 
    professionals: transformedProfessionals
  };
}

/**
 * Transform raw company data into a clean format
 */
export function transformCompany(company: any): CompanyWithDetails {
  // Extract only the fields needed for the response
  // and add the multi-service support flags
  return {
    ...company, // Include all original properties from the company
    address: company.address || undefined,
    hasMultiServiceSupport: true,
    supportsMultiServiceBooking: true
  } as CompanyWithDetails; // Use type assertion to bypass strict type checking
}

/**
 * Check if string looks like a UUID
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-fA-F-]{36}$/.test(str);
}
