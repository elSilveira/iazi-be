import { body, param } from 'express-validator';

export const createUserAddressValidators = [
  body('street').notEmpty().withMessage('Street is required'),
  body('number').notEmpty().withMessage('Number is required'),
  body('neighborhood').notEmpty().withMessage('Neighborhood is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required').isPostalCode('BR').withMessage('Invalid Brazilian zip code format'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
];

export const updateUserAddressValidators = [
  param('addressId').isUUID().withMessage('Invalid address ID format'),
  body('street').optional().notEmpty().withMessage('Street cannot be empty'),
  body('number').optional().notEmpty().withMessage('Number cannot be empty'),
  body('neighborhood').optional().notEmpty().withMessage('Neighborhood cannot be empty'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().notEmpty().withMessage('State cannot be empty'),
  body('zipCode').optional().notEmpty().withMessage('Zip code cannot be empty').isPostalCode('BR').withMessage('Invalid Brazilian zip code format'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
];

export const addressIdParamValidator = [
  param('addressId').isUUID().withMessage('Invalid address ID format'),
];

