import { Router } from 'express';
import * as userAddressController from '../controllers/userAddressController';
import { createUserAddressValidators, updateUserAddressValidators, addressIdParamValidator } from '../validators/userAddressValidators';
import { validateRequest } from '../middlewares/validationMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// All user address routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/addresses:
 *   post:
 *     summary: Create a new address for the authenticated user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserAddressDto'
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAddress'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', createUserAddressValidators, validateRequest, userAddressController.createUserAddress);

/**
 * @swagger
 * /api/users/addresses:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserAddress'
 *       401:
 *         description: Unauthorized
 */
router.get('/', userAddressController.getUserAddresses);

/**
 * @swagger
 * /api/users/addresses/{addressId}:
 *   get:
 *     summary: Get a specific address by ID for the authenticated user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the address to retrieve
 *     responses:
 *       200:
 *         description: Address details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAddress'
 *       400:
 *         description: Invalid address ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found or does not belong to user
 */
router.get('/:addressId', addressIdParamValidator, validateRequest, userAddressController.getUserAddressById);

/**
 * @swagger
 * /api/users/addresses/{addressId}:
 *   put:
 *     summary: Update an address for the authenticated user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the address to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserAddressDto'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAddress'
 *       400:
 *         description: Invalid input data or address ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found or does not belong to user
 */
router.put('/:addressId', updateUserAddressValidators, validateRequest, userAddressController.updateUserAddress);

/**
 * @swagger
 * /api/users/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address for the authenticated user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the address to delete
 *     responses:
 *       204:
 *         description: Address deleted successfully
 *       400:
 *         description: Invalid address ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found or does not belong to user
 */
router.delete('/:addressId', addressIdParamValidator, validateRequest, userAddressController.deleteUserAddress);

export default router;

