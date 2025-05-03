import { Request, Response, NextFunction } from 'express';
import * as companyAddressRepository from '../repositories/companyAddressRepository';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from "../types/express"; // Assuming AuthenticatedRequest is defined here
import { Prisma } from '@prisma/client';

// Middleware to check if the authenticated user owns the company or has permission
// This is a placeholder - implement actual permission logic based on your auth system
const checkCompanyPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction, companyId: string) => {
  // Example: Check if req.user.companyId matches companyId or if user is admin
  // Replace with your actual permission logic
  const hasPermission = true; // Placeholder
  if (!hasPermission) {
    return res.status(403).json({ message: 'Permission denied' });
  }
  next();
};

// Upsert (Create or Update) the address for a specific company
export const upsertCompanyAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
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
    const { companyId: bodyCompanyId, ...addressData } = req.body as Prisma.CompanyAddressUncheckedCreateInput;

    const address = await companyAddressRepository.upsertCompanyAddress(companyId, addressData as Omit<Prisma.CompanyAddressUncheckedCreateInput, 'companyId' | 'id' | 'createdAt' | 'updatedAt'>);
    res.status(200).json(address); // 200 OK for upsert (could be 201 if always creates)
  } catch (error) {
    next(error);
  }
};

// Get the address for a specific company
export const getCompanyAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const companyId = req.params.companyId;

  try {
    const address = await companyAddressRepository.getCompanyAddress(companyId);
    if (!address) {
      res.status(404).json({ message: 'Company address not found' });
      return;
    }
    res.status(200).json(address);
  } catch (error) {
    next(error);
  }
};

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

