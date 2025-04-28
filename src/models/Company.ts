export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface WorkingHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface CompanyService {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  category: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  appointments: number;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  logo: string;
  coverImage: string;
  rating: number;
  totalReviews: number;
  categories: string[];
  yearEstablished: string;
  address: Address;
  phone: string;
  email: string;
  workingHours: {
    monday: WorkingHours;
    tuesday: WorkingHours;
    wednesday: WorkingHours;
    thursday: WorkingHours;
    friday: WorkingHours;
    saturday: WorkingHours;
    sunday: WorkingHours;
  };
  services: CompanyService[];
  staff: StaffMember[];
}
