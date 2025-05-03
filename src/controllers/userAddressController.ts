import { Request, Response, NextFunction } from 'express';
import * as userAddressRepository from '../repositories/userAddressRepository';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from "../types/express"; // Corrected import path
import { Prisma } from '@prisma/client'; // Import Prisma for types

// Create a new address for the authenticated user
export const createUserAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Exit early
  }

  const userId = req.user?.id; // Get user ID from authenticated request
  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return; // Exit early
  }

  try {
    // Explicitly type the body according to the Prisma UserAddress input type
    // Omit userId as it's taken from the authenticated user context
    const { userId: bodyUserId, ...addressData } = req.body as Prisma.UserAddressUncheckedCreateInput;

    const newAddress = await userAddressRepository.createUserAddress(userId, addressData as Omit<Prisma.UserAddressUncheckedCreateInput, 'userId' | 'id' | 'createdAt' | 'updatedAt'>);
    res.status(201).json(newAddress);
  } catch (error) {
    next(error);
  }
};

// Get all addresses for the authenticated user
export const getUserAddresses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return; // Exit early
  }

  try {
    const addresses = await userAddressRepository.getUserAddresses(userId);
    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
};

// Get a specific address by ID for the authenticated user
export const getUserAddressById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Exit early
  }

  const userId = req.user?.id;
  const addressId = req.params.addressId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return; // Exit early
  }

  try {
    const address = await userAddressRepository.getUserAddressById(userId, addressId);
    if (!address) {
      res.status(404).json({ message: 'Address not found or does not belong to user' });
      return; // Exit early
    }
    res.status(200).json(address);
  } catch (error) {
    next(error);
  }
};

// Update an address for the authenticated user
export const updateUserAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Exit early
  }

  const userId = req.user?.id;
  const addressId = req.params.addressId;
  // Explicitly type the update data using Prisma UserAddressUpdateInput
  const updateData: Prisma.UserAddressUpdateInput = req.body;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return; // Exit early
  }

  try {
    const updatedAddress = await userAddressRepository.updateUserAddress(userId, addressId, updateData);
    if (!updatedAddress) {
      res.status(404).json({ message: 'Address not found or does not belong to user' });
      return; // Exit early
    }
    res.status(200).json(updatedAddress);
  } catch (error) {
    next(error);
  }
};

// Delete an address for the authenticated user
export const deleteUserAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Exit early
  }

  const userId = req.user?.id;
  const addressId = req.params.addressId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return; // Exit early
  }

  try {
    const deletedAddress = await userAddressRepository.deleteUserAddress(userId, addressId);
    if (!deletedAddress) {
      res.status(404).json({ message: 'Address not found or does not belong to user' });
      return; // Exit early
    }
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    next(error);
  }
};

