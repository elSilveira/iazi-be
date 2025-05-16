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
  } as ProfessionalWithServices;
}

/**
 * Transform raw service data into a clean format with professionals
 * Each professional in the result will have a complete list of their services
 */
export function transformService(service: any): ServiceWithRelations {
  // Get the category from categoryId relation
  const category = service.category ? {
    id: service.category.id,
    name: service.category.name
  } : undefined;

  // Transform the professional service relationships
  const transformedProfessionals = service.professionals?.map((ps: any) => {
    // Map all services this professional offers with more details
    const services = ps.professional.services?.map((s: any) => {
      // Extract category data for the service if available
      const serviceCategory = s.service.category ? {
        id: s.service.category.id,
        name: s.service.category.name
      } : undefined;
      
      // Get price with proper decimal handling
      const price = typeof s.price === 'object' ? 
        Number(s.price.toString()) : 
        s.price;
      
      return {
        id: s.service.id,
        name: s.service.name,
        duration: s.service.duration,
        price: price,
        description: s.description || s.service.description,
        category: serviceCategory,
        multiServiceEnabled: true
      };
    }) || [];
    
    // Get the price for this specific professional-service relationship
    const price = typeof ps.price === 'object' ? 
      Number(ps.price.toString()) : 
      ps.price;
    
    // Create the professional with complete service details
    return {
      id: ps.professional.id,
      name: ps.professional.name,
      role: ps.professional.role,
      rating: ps.professional.rating,
      image: ps.professional.image,
      price: price,  // Price for this specific service
      company: ps.professional.company,
      hasMultiServiceSupport: true,
      services: services  // Complete array of all services offered by this professional
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
    ...company,
    address: company.address || undefined,
    hasMultiServiceSupport: true,
    supportsMultiServiceBooking: true
  } as CompanyWithDetails;
}

/**
 * Build servicesByProfessional from services data
 * Used when professionals aren't fetched but we need to group services by professional
 * Each professional in the result will have a complete list of their services
 */
export function buildServicesByProfessional(services: any[]): any[] {
  // Step 1: Extract all professionals from services
  const professionalMap = new Map();
  
  // Step 2: For each service, extract its professionals and their services
  services.forEach(service => {
    if (service.professionals && Array.isArray(service.professionals)) {
      service.professionals.forEach((prof: any) => {
        // If this is the first time we see this professional, add it to the map
        if (!professionalMap.has(prof.id)) {
          professionalMap.set(prof.id, {
            id: prof.id,
            name: prof.name,
            role: prof.role,
            rating: prof.rating,
            image: prof.image,
            company: prof.company,
            hasMultiServiceSupport: true,
            services: [] // Will collect all services for this professional
          });
        }
        
        // Get the professional from the map
        const professional = professionalMap.get(prof.id);
        
        // Add this service to the professional's services if it doesn't exist yet
        const serviceExists = professional.services.some(
          (s: any) => s.id === service.id
        );
        
        if (!serviceExists) {
          professional.services.push({
            id: service.id,
            name: service.name,
            duration: service.duration,
            price: prof.price, // Use the price specific to this professional-service relationship
            description: service.description,
            category: service.category,
            multiServiceEnabled: true,
            averageTimeToComplete: service.duration
          });
        }
        
        // If the professional has additional services in the original data, add those too
        if (prof.services && Array.isArray(prof.services)) {
          prof.services.forEach((profService: any) => {
            // Check if this service is already in the professional's services array
            const exists = professional.services.some(
              (s: any) => s.id === profService.id
            );
            
            if (!exists) {
              professional.services.push({
                id: profService.id,
                name: profService.name,
                duration: profService.duration,
                price: profService.price,
                description: profService.description,
                category: profService.category,
                multiServiceEnabled: true,
                averageTimeToComplete: profService.duration
              });
            }
          });
        }
      });
    }
  });
  
  // Step 3: Convert the map to an array
  return Array.from(professionalMap.values());
}

/**
 * Check if string looks like a UUID
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-fA-F-]{36}$/.test(str);
}

/**
 * Reorganizes professional-service relationships to create a list of services with one professional each
 * Used to create the servicesByProfessional response structure 
 * Returns an array of service objects, where each service appears multiple times if it's offered by multiple professionals
 * Each service in the result will have exactly one professional, and that professional will have their complete services list
 */
export function buildServicesWithProfessionals(services: any[]): any[] {
  // Array to hold all service-professional pairs
  const servicesWithProfessionals: any[] = [];
  
  // Map to store all services for each professional across all services
  const professionalServicesMap = new Map();
  
  // Step 1: First pass - collect all professionals and all their services across all services
  services.forEach(service => {
    if (service.professionals && Array.isArray(service.professionals)) {
      service.professionals.forEach((ps: any) => {
        // Extract professional ID and data
        const professional = ps.professional || ps;
        const professionalId = professional.id;
        
        // Initialize entry in the professional services map if it doesn't exist yet
        if (!professionalServicesMap.has(professionalId)) {
          professionalServicesMap.set(professionalId, {
            professionalData: {
              id: professionalId,
              name: professional.name,
              role: professional.role,
              rating: professional.rating,
              image: professional.image,
              hasMultiServiceSupport: true,
              services: []
            },
            services: new Map() // Use a Map to store unique services by ID
          });
        }
        
        // Get the services for this professional
        const profEntry = professionalServicesMap.get(professionalId);
        
        // Extract all services this professional offers (including nested structure)
        if (professional.services && Array.isArray(professional.services)) {
          professional.services.forEach((profService: any) => {
            const serviceObj = profService.service;
            if (!serviceObj) return;
            
            const servicePrice = typeof profService.price === 'object' ? 
              Number(profService.price.toString()) : profService.price;
            
            // Store this service in the professional's services map, using ID as key
            // Only add if it doesn't exist yet, or update with better data if needed
            if (!profEntry.services.has(serviceObj.id)) {
              profEntry.services.set(serviceObj.id, {
                id: serviceObj.id,
                name: serviceObj.name,
                duration: serviceObj.duration,
                price: servicePrice,
                description: profService.description || serviceObj.description,
                category: serviceObj.category ? {
                  id: serviceObj.category.id,
                  name: serviceObj.category.name
                } : undefined,
                multiServiceEnabled: true
              });
            }
          });
        }
        
        // Also add the current service to this professional's services
        // This handles the case where the professional might be linked to the service
        // but the service details aren't in the professional's services array
        const servicePrice = typeof ps.price === 'object' ? 
              Number(ps.price.toString()) : ps.price;
              
        profEntry.services.set(service.id, {
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: servicePrice,
          description: service.description,
          category: service.category,
          multiServiceEnabled: true
        });
      });
    }
  });
  
  // Step 2: Convert each professional's services Map to an array and store in their data
  for (const [profId, profData] of professionalServicesMap.entries()) {
    profData.professionalData.services = Array.from(profData.services.values());
  }
  
  // Step 3: For each service and each of its professionals, create a separate service entry
  services.forEach(service => {
    const serviceKey = service.id;
    
    // Extract all fields except professionals to avoid duplication
    const { professionals, ...serviceData } = service;
    
    // Add a separate service entry for each professional offering this service
    if (service.professionals && Array.isArray(service.professionals)) {
      service.professionals.forEach((ps: any) => {
        const professional = ps.professional || ps;
        const professionalId = professional.id;
          // Only proceed if we have complete professional data
        if (professionalServicesMap.has(professionalId)) {
          // Get professional data without services array
          const { services, ...professionalDataWithoutServices } = professionalServicesMap.get(professionalId).professionalData;

          // Create a new service object for this service-professional pair
          const serviceWithOneProfessional = {
            ...serviceData,
            profissional: {
              ...professionalDataWithoutServices,
              // Add the specific price for this service if available
              price: typeof ps.price === 'object' ? Number(ps.price.toString()) : ps.price
            }
          };
          
          // Add this service-professional pair to our results array
          servicesWithProfessionals.push(serviceWithOneProfessional);
        }
      });
    }
  });
  
  // Return the array of service-professional pairs
  return servicesWithProfessionals;
}