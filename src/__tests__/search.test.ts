import request from 'supertest';
import { app } from '../index';
import { professionalRepository } from '../repositories/professionalRepository';
import { serviceRepository } from '../repositories/serviceRepository';
import companyRepository from '../repositories/companyRepository';

// Mock repositories
jest.mock('../repositories/professionalRepository');
jest.mock('../repositories/serviceRepository');
jest.mock('../repositories/companyRepository');

describe('Search API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/search', () => {
    it('should return all entity types when no type parameter is specified', async () => {
      // Setup repository mocks
      (professionalRepository.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prof1',
          name: 'Dr. Test Professional',
          role: 'Dermatologist',
          services: [
            {
              serviceId: 'service1',
              price: 100,
              description: 'Professional service description',
              service: {
                id: 'service1',
                name: 'Skin Consultation',
                duration: 'PT1H',
                description: 'Service description',
                price: 90
              }
            }
          ]
        }
      ]);
      
      (serviceRepository.findWithProfessionals as jest.Mock).mockResolvedValue([
        {
          id: 'service1',
          name: 'Skin Consultation',
          duration: 'PT1H',
          price: 90,
          professionals: [{ professional: { id: 'prof1', name: 'Dr. Test Professional' } }]
        }
      ]);
      
      (companyRepository.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'company1',
          name: 'Test Clinic',
          description: 'A test clinic',
          categories: ['Dermatology', 'Aesthetics']
        }
      ]);
      
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'test' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('professionals');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('companies');
      
      // Check if findMany was called with correct filters
      expect(professionalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'test', mode: 'insensitive' } },
            { role: { contains: 'test', mode: 'insensitive' } }
          ])
        }),
        expect.any(Object),
        expect.any(Number),
        expect.any(Number)
      );
    });
    
    it('should filter professionals by category', async () => {
      // Setup repository mock
      (professionalRepository.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prof1',
          name: 'Dr. Test Professional',
          role: 'Dermatologist',
          services: [
            {
              serviceId: 'service1',
              price: 100,
              service: {
                id: 'service1',
                name: 'Skin Consultation',
                duration: 'PT1H'
              }
            }
          ]
        }
      ]);
      
      (serviceRepository.findWithProfessionals as jest.Mock).mockResolvedValue([]);
      (companyRepository.findMany as jest.Mock).mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/search')
        .query({ 
          type: 'professionals',
          category: 'dermatology' 
        });
      
      expect(response.status).toBe(200);
      expect(response.body.professionals).toHaveLength(1);
      
      // Check if findMany was called with correct category filter
      expect(professionalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          services: expect.objectContaining({
            some: expect.objectContaining({
              service: expect.objectContaining({
                category: expect.objectContaining({
                  name: expect.objectContaining({
                    contains: 'dermatology',
                    mode: 'insensitive'
                  })
                })
              })
            })
          })
        }),
        expect.any(Object),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should filter professionals by role', async () => {
      // Setup repository mock
      (professionalRepository.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prof1',
          name: 'Dr. Test Professional',
          role: 'Dermatologist',
          services: [
            {
              serviceId: 'service1',
              price: 100,
              service: {
                id: 'service1',
                name: 'Skin Consultation',
                duration: 'PT1H'
              }
            }
          ]
        }
      ]);
      
      (serviceRepository.findWithProfessionals as jest.Mock).mockResolvedValue([]);
      (companyRepository.findMany as jest.Mock).mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/search')
        .query({ 
          type: 'professionals',
          professionalTipo: 'dermatologist' 
        });
      
      expect(response.status).toBe(200);
      expect(response.body.professionals).toHaveLength(1);
      
      // Check if findMany was called with correct role filter
      expect(professionalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          role: expect.objectContaining({
            contains: 'dermatologist',
            mode: 'insensitive'
          })
        }),
        expect.any(Object),
        expect.any(Number),
        expect.any(Number)
      );
    });
    
    it('should correctly map professional services with prices', async () => {
      // Setup mock with price overrides
      (professionalRepository.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prof1',
          name: 'Dr. Test Professional',
          services: [
            {
              serviceId: 'service1',
              price: 120, // Professional's custom price
              description: 'Custom description',
              service: {
                id: 'service1',
                name: 'Skin Consultation',
                duration: 'PT1H',
                price: 100, // Default price
                description: 'Default description'
              }
            },
            {
              serviceId: 'service2',
              // No custom price defined, should use default
              service: {
                id: 'service2',
                name: 'Acne Treatment',
                duration: 'PT30M',
                price: 75,
                description: 'Acne treatment description'
              }
            }
          ]
        }
      ]);
      
      (serviceRepository.findWithProfessionals as jest.Mock).mockResolvedValue([]);
      (companyRepository.findMany as jest.Mock).mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/search')
        .query({ type: 'professionals' });
      
      expect(response.status).toBe(200);
      expect(response.body.professionals).toHaveLength(1);
      
      // Check service mapping
      const professional = response.body.professionals[0];
      expect(professional.services).toHaveLength(2);
      
      // Check first service with custom price and description
      const service1 = professional.services.find((s: any) => s.id === 'service1');
      expect(service1.price).toBe(120); // Should use professional's custom price
      expect(service1.description).toBe('Custom description'); // Should use professional's custom description
      
      // Check second service with default price and description
      const service2 = professional.services.find((s: any) => s.id === 'service2');
      expect(service2.price).toBe(75); // Should fall back to default price
      expect(service2.description).toBe('Acne treatment description'); // Should fall back to default description
    });

    it('should apply pagination correctly', async () => {
      (professionalRepository.findMany as jest.Mock).mockResolvedValue([]);
      (serviceRepository.findWithProfessionals as jest.Mock).mockResolvedValue([]);
      (companyRepository.findMany as jest.Mock).mockResolvedValue([]);
      
      await request(app)
        .get('/api/search')
        .query({ 
          page: '2',
          limit: '15'
        });
      
      // Check if pagination parameters were passed correctly
      expect(professionalRepository.findMany).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        15, // skip (page-1)*limit
        15  // limit
      );
      
      expect(companyRepository.findMany).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        15, // skip
        15  // limit
      );
    });
    
    it('should handle empty search results gracefully', async () => {
      (professionalRepository.findMany as jest.Mock).mockResolvedValue([]);
      (serviceRepository.findWithProfessionals as jest.Mock).mockResolvedValue([]);
      (companyRepository.findMany as jest.Mock).mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'nonexistent' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        professionals: [],
        services: [],
        companies: []
      });
    });
  });

  describe('Integration with Appointment Availability', () => {
    it('should allow finding a professional and checking their availability', async () => {
      // This test would integrate with the appointment controller's availability endpoint
      // It's a more complex integration test that would require additional mocks
      
      // First find a professional
      (professionalRepository.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prof1',
          name: 'Dr. Test Professional',
          services: [
            {
              serviceId: 'service1',
              price: 100,
              service: {
                id: 'service1',
                name: 'Skin Consultation',
                duration: 'PT1H'
              }
            }
          ]
        }
      ]);
      
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ type: 'professionals' });
      
      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.professionals).toHaveLength(1);
      
      const professional = searchResponse.body.professionals[0];
      const service = professional.services[0];
      
      // Now we would check availability but this would need additional mocks
      // for the appointment controller, so we'll just verify the data we would need
      expect(professional.id).toBe('prof1');
      expect(service.id).toBe('service1');
      
      // In a full integration test, we'd then call:
      // GET /api/appointments/availability?professionalId=prof1&serviceId=service1&date=2023-06-10
    });
  });
});
