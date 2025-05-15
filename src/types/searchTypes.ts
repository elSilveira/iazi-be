// types.ts - Define proper types
import { Professional, Service, Company } from '@prisma/client';

export interface ServiceWithRelations extends Service {
  category?: {
    id: string;
    name: string;
  };
  professionals?: {
    id: string;
    name: string;
    role?: string;
    rating?: number;
    image?: string;
    company?: any;
    price?: number;
    hasMultiServiceSupport?: boolean;
    otherServices?: {
      id: string;
      name: string;
      duration?: string;
      price?: number;
    }[];
  }[];
  multiServiceEnabled?: boolean;
}

export interface ProfessionalWithServices extends Omit<Professional, 'services'> {
  services: {
    id: string;
    name: string;
    duration?: string;
    price?: number;
    description?: string;
    category?: any;
    multiServiceEnabled?: boolean;
    averageTimeToComplete?: string;
  }[];
  hasMultiServiceSupport?: boolean;
}

export interface CompanyWithDetails extends Omit<Company, 'address'> {
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
  hasMultiServiceSupport?: boolean;
  supportsMultiServiceBooking?: boolean;
}

export interface SearchResult {
  professionals?: ProfessionalWithServices[];
  services?: ServiceWithRelations[];
  companies?: CompanyWithDetails[];
}

export type SearchType = 'professionals' | 'services' | 'companies' | 'all';

export interface SearchFilters {
  q?: string;
  category?: string;
  professionalTipo?: string;
  sort?: string;
  page: number;
  limit: number;
  type?: SearchType;
  ids?: string[];
}
