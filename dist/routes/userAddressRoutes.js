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
const userAddressController = __importStar(require("../controllers/userAddressController"));
const userAddressValidators_1 = require("../validators/userAddressValidators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// All user address routes require authentication
router.use(authMiddleware_1.authMiddleware);
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
router.post('/', userAddressValidators_1.createUserAddressValidators, validationMiddleware_1.validateRequest, userAddressController.createUserAddress);
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
router.get('/:addressId', userAddressValidators_1.addressIdParamValidator, validationMiddleware_1.validateRequest, userAddressController.getUserAddressById);
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
router.put('/:addressId', userAddressValidators_1.updateUserAddressValidators, validationMiddleware_1.validateRequest, userAddressController.updateUserAddress);
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
router.delete('/:addressId', userAddressValidators_1.addressIdParamValidator, validationMiddleware_1.validateRequest, userAddressController.deleteUserAddress);
exports.default = router;
