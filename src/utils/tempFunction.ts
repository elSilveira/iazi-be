/**
 * Reorganizes professional-service relationships to create a list of services with their professionals
 * Used to create the servicesByProfessional response structure where each service has professionals
 */
export function buildServicesWithProfessionals(services: any[]): any[] {
  // Map to hold unique services with their professionals
  const serviceMap = new Map();
  
  // Step 1: For each service, collect all its professionals
  services.forEach(service => {
    const serviceKey = service.id;
    
    // If this is the first time we see this service, add it to the map
    if (!serviceMap.has(serviceKey)) {
      const { professionals, ...serviceData } = service;
      serviceMap.set(serviceKey, {
        ...serviceData,
        professionals: []
      });
    }
    
    // Add professionals to this service
    if (service.professionals && Array.isArray(service.professionals)) {
      const serviceEntry = serviceMap.get(serviceKey);
      
      service.professionals.forEach((ps: any) => {
        // Extract the professional details
        const professional = ps.professional;
        if (!professional) return;
        
        // Extract professional data, avoiding duplicates
        const professionalData: any = {
          id: professional.id,
          name: professional.name,
          role: professional.role,
          rating: professional.rating,
          image: professional.image,
          price: typeof ps.price === 'object' ? Number(ps.price.toString()) : ps.price
        };
        
        // Extract all services for this professional from the nested services structure
        if (professional.services && Array.isArray(professional.services)) {
          // Map each professional's service to a simpler structure
          const profServices = professional.services.map((profService: any) => {
            const serviceObj = profService.service;
            if (!serviceObj) return null;
            
            return {
              id: serviceObj.id,
              name: serviceObj.name,
              duration: serviceObj.duration,
              price: typeof profService.price === 'object' ? 
                Number(profService.price.toString()) : profService.price,
              description: profService.description || serviceObj.description,
              category: serviceObj.category ? {
                id: serviceObj.category.id,
                name: serviceObj.category.name
              } : undefined
            };
          }).filter(Boolean); // Remove any null entries
          
          // Add the services array to the professional data
          professionalData.services = profServices;
        } else {
          professionalData.services = []; // Empty services array for consistency
        }
        
        // Add professional to the service's professionals array
        serviceEntry.professionals.push(professionalData);
      });
    }
  });
  
  // Step 3: Convert the map to an array
  return Array.from(serviceMap.values());
}
