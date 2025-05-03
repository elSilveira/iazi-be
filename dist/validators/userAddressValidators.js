"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressIdParamValidator = exports.updateUserAddressValidators = exports.createUserAddressValidators = void 0;
const express_validator_1 = require("express-validator");
exports.createUserAddressValidators = [
    (0, express_validator_1.body)('street').notEmpty().withMessage('Street is required'),
    (0, express_validator_1.body)('number').notEmpty().withMessage('Number is required'),
    (0, express_validator_1.body)('neighborhood').notEmpty().withMessage('Neighborhood is required'),
    (0, express_validator_1.body)('city').notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('state').notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('zipCode').notEmpty().withMessage('Zip code is required').isPostalCode('BR').withMessage('Invalid Brazilian zip code format'),
    (0, express_validator_1.body)('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
];
exports.updateUserAddressValidators = [
    (0, express_validator_1.param)('addressId').isUUID().withMessage('Invalid address ID format'),
    (0, express_validator_1.body)('street').optional().notEmpty().withMessage('Street cannot be empty'),
    (0, express_validator_1.body)('number').optional().notEmpty().withMessage('Number cannot be empty'),
    (0, express_validator_1.body)('neighborhood').optional().notEmpty().withMessage('Neighborhood cannot be empty'),
    (0, express_validator_1.body)('city').optional().notEmpty().withMessage('City cannot be empty'),
    (0, express_validator_1.body)('state').optional().notEmpty().withMessage('State cannot be empty'),
    (0, express_validator_1.body)('zipCode').optional().notEmpty().withMessage('Zip code cannot be empty').isPostalCode('BR').withMessage('Invalid Brazilian zip code format'),
    (0, express_validator_1.body)('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
];
exports.addressIdParamValidator = [
    (0, express_validator_1.param)('addressId').isUUID().withMessage('Invalid address ID format'),
];
