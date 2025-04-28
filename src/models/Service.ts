export interface Service {
  id: number;
  name: string;
  category: string;
  company: string;
  professional: string;
  image: string;
  rating: number;
  reviews: number;
  price: string;
  duration: string;
  availability: string;
  company_id: string;
  professional_id: string;
  description: string;
}

export interface Specialty {
  name: string;
}

export interface AvailabilityOption {
  name: string;
}
