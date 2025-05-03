"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
exports.getCompanyAddress = exports.upsertCompanyAddress = void 0;
const companyAddressRepository = __importStar(require("../repositories/companyAddressRepository"));
const express_validator_1 = require("express-validator");
// Middleware to check if the authenticated user owns the company or has permission
// This is a placeholder - implement actual permission logic based on your auth system
const checkCompanyPermission = (req, res, next, companyId) => __awaiter(void 0, void 0, void 0, function* () {
    // Example: Check if req.user.companyId matches companyId or if user is admin
    // Replace with your actual permission logic
    const hasPermission = true; // Placeholder
    if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
    }
    next();
});
// Upsert (Create or Update) the address for a specific company
const upsertCompanyAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const companyId = req.params.companyId; // Assuming companyId is in the route params
    // --- Permission Check --- 
    // You MUST implement proper permission checks here to ensure the user
    // has the right to modify this company's address.
    // Example: checkCompanyPermission(req, res, next, companyId);
    // For now, proceeding without explicit check as per placeholder.
    // --- End Permission Check --- 
    try {
        // Omit companyId as it's taken from the route param
        const _a = req.body, { companyId: bodyCompanyId } = _a, addressData = __rest(_a, ["companyId"]);
        const address = yield companyAddressRepository.upsertCompanyAddress(companyId, addressData);
        res.status(200).json(address); // 200 OK for upsert (could be 201 if always creates)
    }
    catch (error) {
        next(error);
    }
});
exports.upsertCompanyAddress = upsertCompanyAddress;
// Get the address for a specific company
const getCompanyAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const companyId = req.params.companyId;
    try {
        const address = yield companyAddressRepository.getCompanyAddress(companyId);
        if (!address) {
            res.status(404).json({ message: 'Company address not found' });
            return;
        }
        res.status(200).json(address);
    }
    catch (error) {
        next(error);
    }
});
exports.getCompanyAddress = getCompanyAddress;
// Delete company address (if needed)
// export const deleteCompanyAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     res.status(400).json({ errors: errors.array() });
//     return;
//   }
//   const companyId = req.params.companyId;
//   // --- Permission Check --- 
//   // Implement proper permission checks here.
//   // --- End Permission Check --- 
//   try {
//     const deletedAddress = await companyAddressRepository.deleteCompanyAddress(companyId);
//     if (!deletedAddress) {
//       res.status(404).json({ message: 'Company address not found' });
//       return;
//     }
//     res.status(204).send(); // No content
//   } catch (error) {
//     next(error);
//   }
// };
