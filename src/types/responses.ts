// src/types/responses.ts
import { CompanyWithDetails, ProfessionalWithServices, ServiceWithRelations } from "./searchTypes";

/**
 * Response objects for the search API
 */

export interface ProfessionalResponse extends ProfessionalWithServices {
  // Ensure this property is required
  hasMultiServiceSupport: boolean;
}

export interface ServiceResponse extends ServiceWithRelations {
  // Ensure this property is required
  multiServiceEnabled: boolean;
}

export interface CompanyResponse extends CompanyWithDetails {
  // Ensure these properties are required
  hasMultiServiceSupport: boolean;
  supportsMultiServiceBooking: boolean;
}

export interface SearchResponse {
  professionals?: ProfessionalResponse[];
  services?: ServiceResponse[];
  companies?: CompanyResponse[];
}
