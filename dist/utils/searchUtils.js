"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformProfessional = transformProfessional;
exports.transformService = transformService;
exports.transformCompany = transformCompany;
exports.isUUID = isUUID;
/**
 * Transform raw professional data into a clean format with services
 */
function transformProfessional(prof) {
    var _a;
    // Map services with proper category handling and price conversion
    const mappedServices = ((_a = prof.services) === null || _a === void 0 ? void 0 : _a.map((ps) => {
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
    })) || [];
    // Exclude services property to avoid duplication
    const { services: _ } = prof, profWithoutServices = __rest(prof, ["services"]);
    // Return the professional with multi-service support
    return Object.assign(Object.assign({}, profWithoutServices), { services: mappedServices, hasMultiServiceSupport: true }); // Use type assertion to bypass strict type checking
}
/**
 * Transform raw service data into a clean format with professionals
 */
function transformService(service) {
    var _a;
    // Get the category from categoryId relation
    const category = service.category ? {
        id: service.category.id,
        name: service.category.name
    } : undefined;
    // Transform the professional service relationships
    const transformedProfessionals = ((_a = service.professionals) === null || _a === void 0 ? void 0 : _a.map((ps) => {
        var _a;
        // Map other services this professional offers
        const otherServices = ((_a = ps.professional.services) === null || _a === void 0 ? void 0 : _a.map((s) => ({
            id: s.service.id,
            name: s.service.name,
            duration: s.service.duration,
            price: typeof s.price === 'object' ? Number(s.price.toString()) : s.price
        }))) || [];
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
    })) || [];
    // Create the enhanced service with multi-service enabled
    return Object.assign(Object.assign({}, service), { category, multiServiceEnabled: true, professionals: transformedProfessionals });
}
/**
 * Transform raw company data into a clean format
 */
function transformCompany(company) {
    // Extract only the fields needed for the response
    // and add the multi-service support flags
    return Object.assign(Object.assign({}, company), { address: company.address || undefined, hasMultiServiceSupport: true, supportsMultiServiceBooking: true }); // Use type assertion to bypass strict type checking
}
/**
 * Check if string looks like a UUID
 */
function isUUID(str) {
    return /^[0-9a-fA-F-]{36}$/.test(str);
}
