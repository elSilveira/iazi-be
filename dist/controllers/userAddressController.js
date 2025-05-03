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
exports.deleteUserAddress = exports.updateUserAddress = exports.getUserAddressById = exports.getUserAddresses = exports.createUserAddress = void 0;
const userAddressRepository = __importStar(require("../repositories/userAddressRepository"));
const express_validator_1 = require("express-validator");
// Create a new address for the authenticated user
const createUserAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return; // Exit early
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get user ID from authenticated request
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return; // Exit early
    }
    try {
        // Explicitly type the body according to the Prisma UserAddress input type
        // Omit userId as it's taken from the authenticated user context
        const _b = req.body, { userId: bodyUserId } = _b, addressData = __rest(_b, ["userId"]);
        const newAddress = yield userAddressRepository.createUserAddress(userId, addressData);
        res.status(201).json(newAddress);
    }
    catch (error) {
        next(error);
    }
});
exports.createUserAddress = createUserAddress;
// Get all addresses for the authenticated user
const getUserAddresses = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return; // Exit early
    }
    try {
        const addresses = yield userAddressRepository.getUserAddresses(userId);
        res.status(200).json(addresses);
    }
    catch (error) {
        next(error);
    }
});
exports.getUserAddresses = getUserAddresses;
// Get a specific address by ID for the authenticated user
const getUserAddressById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return; // Exit early
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const addressId = req.params.addressId;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return; // Exit early
    }
    try {
        const address = yield userAddressRepository.getUserAddressById(userId, addressId);
        if (!address) {
            res.status(404).json({ message: 'Address not found or does not belong to user' });
            return; // Exit early
        }
        res.status(200).json(address);
    }
    catch (error) {
        next(error);
    }
});
exports.getUserAddressById = getUserAddressById;
// Update an address for the authenticated user
const updateUserAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return; // Exit early
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const addressId = req.params.addressId;
    // Explicitly type the update data using Prisma UserAddressUpdateInput
    const updateData = req.body;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return; // Exit early
    }
    try {
        const updatedAddress = yield userAddressRepository.updateUserAddress(userId, addressId, updateData);
        if (!updatedAddress) {
            res.status(404).json({ message: 'Address not found or does not belong to user' });
            return; // Exit early
        }
        res.status(200).json(updatedAddress);
    }
    catch (error) {
        next(error);
    }
});
exports.updateUserAddress = updateUserAddress;
// Delete an address for the authenticated user
const deleteUserAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return; // Exit early
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const addressId = req.params.addressId;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return; // Exit early
    }
    try {
        const deletedAddress = yield userAddressRepository.deleteUserAddress(userId, addressId);
        if (!deletedAddress) {
            res.status(404).json({ message: 'Address not found or does not belong to user' });
            return; // Exit early
        }
        res.status(204).send(); // No content on successful deletion
    }
    catch (error) {
        next(error);
    }
});
exports.deleteUserAddress = deleteUserAddress;
