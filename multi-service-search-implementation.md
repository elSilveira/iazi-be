# Multi-Service Appointment Implementation Guide

This document outlines the key improvements needed to support multi-service appointments and improve code quality in the search routes.

## Overview of Changes

The current search routes implementation has been enhanced to support multi-service appointments with the following features:

1. Professionals have a `hasMultiServiceSupport` flag
2. Services have a `multiServiceEnabled` flag
3. Professional data includes other services they can provide
4. Service data includes professionals who can perform that service
5. Search by ID and multiple IDs is supported
6. Filtering by type returns only the requested entity type

## Implementation Recommendations

### 1. Type Definitions

We've already created proper type definitions in `src/types/searchTypes.ts`. These should be used consistently throughout the codebase:

```typescript
// Key types for search
export interface ProfessionalWithServices {...}
export interface ServiceWithRelations {...}
export interface CompanyWithDetails {...}
export interface SearchResult {...}
```

### 2. Utility Functions

The transformation logic has been extracted to `src/utils/searchUtils.ts` with these key functions:

```typescript
export function transformProfessional(prof: any): ProfessionalWithServices {...}
export function transformService(service: any): ServiceWithRelations {...}
export function transformCompany(company: any): CompanyWithDetails {...}
export function isUUID(str: string): boolean {...}
```

### 3. Repository Improvements

Key improvements to repositories:

1. `serviceRepository.ts`: 
   - Ensure `findMany` and `findWithProfessionals` include proper filtering
   - Add multi-service support data to returned services

2. `professionalRepository.ts`:
   - Update `includeDetails` to fetch services and related data
   - Support filtering by multiple IDs

### 4. Search Route Improvements

The search route in `searchRoutes_new.ts` should:

1. Conditionally fetch data based on the requested type
2. Apply proper transformations with multi-service support
3. Return only the requested entity types
4. Support filtering by ID and multiple IDs
5. Include proper error handling

## Multi-Service Appointment UI Integration

When integrating with the frontend:

1. Show available professionals with `hasMultiServiceSupport: true`
2. Only show services with `multiServiceEnabled: true` in multi-service booking flows
3. Use `otherServices` array to suggest additional services from the same professional
4. For booking, send an array of service IDs rather than a single service ID

## Testing

Test scenarios should include:

1. Searching by service ID and getting correct multi-service enabled results
2. Searching by professional ID and getting all their services
3. Filtering by type parameter and ensuring only requested data is returned
4. Verifying multi-service flags are correctly set in responses

## Next Steps

1. Complete any remaining TypeScript type definitions
2. Apply consistent error handling throughout the codebase
3. Add unit and integration tests for the search routes
4. Update frontend components to leverage the multi-service capabilities
