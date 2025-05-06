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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyAddressController = __importStar(require("../controllers/companyAddressController"));
const companyAddressValidators_1 = require("../validators/companyAddressValidators");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Corrected: Use authMiddleware
const validationMiddleware_1 = require("../middlewares/validationMiddleware"); // Added import for validateRequest
const router = (0, express_1.Router)();
// Route to get company address (Public or authenticated? Assuming public for now)
router.get("/:companyId", companyAddressValidators_1.companyAddressIdValidationRules, validationMiddleware_1.validateRequest, // Use imported validateRequest
companyAddressController.getCompanyAddress);
// Route to create or update company address (Requires authentication and likely specific permissions)
router.put("/:companyId", authMiddleware_1.authMiddleware, // Use imported authMiddleware
// Add specific permission middleware here if needed (e.g., check if user owns the company)
companyAddressValidators_1.companyAddressValidationRules, validationMiddleware_1.validateRequest, // Use imported validateRequest
companyAddressController.upsertCompanyAddress);
// Optional: Route to delete company address (if needed)
// router.delete(
//   "/:companyId",
//   authMiddleware, // Use imported authMiddleware
//   // Add specific permission middleware here
//   companyAddressIdValidationRules,
//   validateRequest, // Use imported validateRequest
//   companyAddressController.deleteCompanyAddress
// );
exports.default = router;
