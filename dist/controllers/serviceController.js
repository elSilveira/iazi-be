"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceById = exports.getAllServices = void 0;
// Mock data based on frontend's mock-services.ts
const mockServicesDb = [
    {
        id: 1,
        name: "Limpeza de Pele Profunda",
        category: "Tratamento Facial",
        company: "Clínica DermaBem",
        professional: "Dra. Ana Silva",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881",
        rating: 4.8,
        reviews: 87,
        price: "R$180",
        duration: "60 min",
        availability: "Hoje",
        company_id: "clinica-dermabem-123",
        professional_id: "dra-ana-silva-456",
        description: "Limpeza de pele completa com extração de cravos e espinhas, esfoliação e hidratação profunda para todos os tipos de pele.",
    },
    {
        id: 2,
        name: "Quiropraxia",
        category: "Fisioterapia",
        company: "FisioSaúde",
        professional: "Dr. Carlos Mendes",
        image: "https://images.unsplash.com/photo-1552693673-1bf958298935",
        rating: 4.9,
        reviews: 112,
        price: "R$150",
        duration: "45 min",
        availability: "Amanhã",
        company_id: "fisiosaude-789",
        professional_id: "dr-carlos-mendes-101",
        description: "Tratamento quiroprático para alinhamento da coluna, alívio de tensões musculares e melhora da postura corporal.",
    },
    // Add more mock services if needed based on mock-services.ts
];
const getAllServices = (req, res) => {
    return res.json(mockServicesDb);
};
exports.getAllServices = getAllServices;
const getServiceById = (req, res) => {
    const id = parseInt(req.params.id, 10);
    const service = mockServicesDb.find((s) => s.id === id);
    if (service) {
        return res.json(service);
    }
    else {
        return res.status(404).json({ message: 'Serviço não encontrado' });
    }
};
exports.getServiceById = getServiceById;
