"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyMiddleware = void 0;
// Dummy middleware for testing
const dummyMiddleware = (req, res, next) => {
    console.log("Dummy middleware executed");
    next();
};
exports.dummyMiddleware = dummyMiddleware;
