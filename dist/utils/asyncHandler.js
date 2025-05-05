"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Higher-order function to catch errors from async route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.default = asyncHandler;
