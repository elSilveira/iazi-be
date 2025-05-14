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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const professionalRepository_1 = require("../repositories/professionalRepository");
const serviceRepository_1 = require("../repositories/serviceRepository");
const companyRepository_1 = __importDefault(require("../repositories/companyRepository"));
// Mock repositories
jest.mock('../repositories/professionalRepository');
jest.mock('../repositories/serviceRepository');
jest.mock('../repositories/companyRepository');
describe('Search API', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    describe('GET /api/search', () => {
        it('should return all entity types when no type parameter is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup repository mocks
            professionalRepository_1.professionalRepository.findMany.mockResolvedValue([
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
            serviceRepository_1.serviceRepository.findWithProfessionals.mockResolvedValue([
                {
                    id: 'service1',
                    name: 'Skin Consultation',
                    duration: 'PT1H',
                    price: 90,
                    professionals: [{ professional: { id: 'prof1', name: 'Dr. Test Professional' } }]
                }
            ]);
            companyRepository_1.default.findMany.mockResolvedValue([
                {
                    id: 'company1',
                    name: 'Test Clinic',
                    description: 'A test clinic',
                    categories: ['Dermatology', 'Aesthetics']
                }
            ]);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/search')
                .query({ q: 'test' });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('professionals');
            expect(response.body).toHaveProperty('services');
            expect(response.body).toHaveProperty('companies');
            // Check if findMany was called with correct filters
            expect(professionalRepository_1.professionalRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                OR: expect.arrayContaining([
                    { name: { contains: 'test', mode: 'insensitive' } },
                    { role: { contains: 'test', mode: 'insensitive' } }
                ])
            }), expect.any(Object), expect.any(Number), expect.any(Number));
        }));
        it('should filter professionals by category', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup repository mock
            professionalRepository_1.professionalRepository.findMany.mockResolvedValue([
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
            serviceRepository_1.serviceRepository.findWithProfessionals.mockResolvedValue([]);
            companyRepository_1.default.findMany.mockResolvedValue([]);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/search')
                .query({
                type: 'professionals',
                category: 'dermatology'
            });
            expect(response.status).toBe(200);
            expect(response.body.professionals).toHaveLength(1);
            // Check if findMany was called with correct category filter
            expect(professionalRepository_1.professionalRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
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
            }), expect.any(Object), expect.any(Number), expect.any(Number));
        }));
        it('should filter professionals by role', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup repository mock
            professionalRepository_1.professionalRepository.findMany.mockResolvedValue([
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
            serviceRepository_1.serviceRepository.findWithProfessionals.mockResolvedValue([]);
            companyRepository_1.default.findMany.mockResolvedValue([]);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/search')
                .query({
                type: 'professionals',
                professionalTipo: 'dermatologist'
            });
            expect(response.status).toBe(200);
            expect(response.body.professionals).toHaveLength(1);
            // Check if findMany was called with correct role filter
            expect(professionalRepository_1.professionalRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                role: expect.objectContaining({
                    contains: 'dermatologist',
                    mode: 'insensitive'
                })
            }), expect.any(Object), expect.any(Number), expect.any(Number));
        }));
        it('should correctly map professional services with prices', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup mock with price overrides
            professionalRepository_1.professionalRepository.findMany.mockResolvedValue([
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
            serviceRepository_1.serviceRepository.findWithProfessionals.mockResolvedValue([]);
            companyRepository_1.default.findMany.mockResolvedValue([]);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/search')
                .query({ type: 'professionals' });
            expect(response.status).toBe(200);
            expect(response.body.professionals).toHaveLength(1);
            // Check service mapping
            const professional = response.body.professionals[0];
            expect(professional.services).toHaveLength(2);
            // Check first service with custom price and description
            const service1 = professional.services.find((s) => s.id === 'service1');
            expect(service1.price).toBe(120); // Should use professional's custom price
            expect(service1.description).toBe('Custom description'); // Should use professional's custom description
            // Check second service with default price and description
            const service2 = professional.services.find((s) => s.id === 'service2');
            expect(service2.price).toBe(75); // Should fall back to default price
            expect(service2.description).toBe('Acne treatment description'); // Should fall back to default description
        }));
        it('should apply pagination correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            professionalRepository_1.professionalRepository.findMany.mockResolvedValue([]);
            serviceRepository_1.serviceRepository.findWithProfessionals.mockResolvedValue([]);
            companyRepository_1.default.findMany.mockResolvedValue([]);
            yield (0, supertest_1.default)(index_1.app)
                .get('/api/search')
                .query({
                page: '2',
                limit: '15'
            });
            // Check if pagination parameters were passed correctly
            expect(professionalRepository_1.professionalRepository.findMany).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 15, // skip (page-1)*limit
            15 // limit
            );
            expect(companyRepository_1.default.findMany).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 15, // skip
            15 // limit
            );
        }));
        it('should handle empty search results gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            professionalRepository_1.professionalRepository.findMany.mockResolvedValue([]);
            serviceRepository_1.serviceRepository.findWithProfessionals.mockResolvedValue([]);
            companyRepository_1.default.findMany.mockResolvedValue([]);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/search')
                .query({ q: 'nonexistent' });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                professionals: [],
                services: [],
                companies: []
            });
        }));
    });
    describe('Integration with Appointment Availability', () => {
        it('should allow finding a professional and checking their availability', () => __awaiter(void 0, void 0, void 0, function* () {
            // This test would integrate with the appointment controller's availability endpoint
            // It's a more complex integration test that would require additional mocks
            // First find a professional
            professionalRepository_1.professionalRepository.findMany.mockResolvedValue([
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
            const searchResponse = yield (0, supertest_1.default)(index_1.app)
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
        }));
    });
});
