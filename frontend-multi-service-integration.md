# Frontend Integration Guide for Multi-Service Search API

This document provides a comprehensive guide on how to integrate with the enhanced search API to support multi-service appointments.

## Search API Overview

The search endpoint (`/api/search`) now supports multi-service appointments with enhanced data structures and filtering capabilities.

### Key Features

1. **Entity-specific filtering** - Filter by professionals, services, or companies
2. **Multi-service flags** - Each entity includes flags indicating multi-service support
3. **Related services** - Professionals include other services they can perform
4. **ID-based search** - Search by UUID or multiple IDs
5. **Category filtering** - Filter by service category

## API Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter type: `professionals`, `services`, `companies`, or `all` |
| `q` | string | Search term or UUID for exact match |
| `ids` | string | Comma-separated list of IDs to filter by |
| `category` | string | Category name to filter by |
| `professionalTipo` | string | Professional type to filter by |
| `sort` | string | Sort order: `rating` or `name` (default) |
| `page` | number | Page number (1-based) |
| `limit` | number | Items per page |

## Response Structure

The response includes the requested entity types based on the `type` parameter:

```typescript
interface SearchResponse {
  professionals?: ProfessionalResponse[];
  services?: ServiceResponse[];
  companies?: CompanyResponse[];
}
```

### Professional Response

```typescript
interface ProfessionalResponse {
  id: string;
  name: string;
  role?: string;
  rating?: number;
  image?: string;
  services: ServiceInProfessionalResponse[];
  hasMultiServiceSupport: boolean; // Flag for multi-service support
}

interface ServiceInProfessionalResponse {
  id: string;
  name: string;
  duration?: string;
  price?: number;
  description?: string;
  category?: { id: string; name: string };
  multiServiceEnabled: boolean; // Flag for multi-service support
  averageTimeToComplete?: string;
}
```

### Service Response

```typescript
interface ServiceResponse {
  id: string;
  name: string;
  duration?: string;
  price?: number;
  description?: string;
  category?: { id: string; name: string };
  multiServiceEnabled: boolean; // Flag for multi-service support
  averageTimeToComplete?: string;
  professionals?: ProfessionalInServiceResponse[];
}

interface ProfessionalInServiceResponse {
  id: string;
  name: string;
  role?: string;
  rating?: number;
  image?: string;
  price?: number;
  company?: any;
  hasMultiServiceSupport: boolean; // Flag for multi-service support
  otherServices: { // Other services this professional can perform
    id: string;
    name: string;
    duration?: string;
    price?: number;
  }[];
}
```

### Company Response

```typescript
interface CompanyResponse {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  rating?: number;
  totalReviews?: number;
  address?: any;
  categories?: string[];
  hasMultiServiceSupport: boolean; // Flag for multi-service support
  supportsMultiServiceBooking: boolean; // Flag for multi-service booking
}
```

## Integration Examples

### Example 1: Fetch Services by ID

```javascript
// Fetch services by ID
const fetchServiceById = async (serviceId) => {
  const response = await fetch(`/api/search?q=${serviceId}&type=services`);
  const data = await response.json();
  return data.services[0]; // Get the first matching service
};
```

### Example 2: Search Professionals with Multi-Service Support

```javascript
// Search professionals with multi-service support
const searchProfessionals = async (searchTerm, category) => {
  let url = `/api/search?type=professionals`;
  if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Filter to only show professionals with multi-service support
  return data.professionals.filter(p => p.hasMultiServiceSupport);
};
```

### Example 3: Fetch Multiple Services by IDs

```javascript
// Fetch multiple services by IDs
const fetchServicesByIds = async (serviceIds) => {
  const idsParam = serviceIds.join(',');
  const response = await fetch(`/api/search?ids=${idsParam}&type=services`);
  const data = await response.json();
  return data.services;
};
```

## Implementing Multi-Service Booking UI

To implement a multi-service booking UI:

1. Display a service selection interface that allows multiple selections
2. When a service is selected:
   - Show only professionals with `hasMultiServiceSupport: true`
   - Filter to professionals who can perform all selected services
3. Display the total estimated duration (sum of service durations)
4. Display the total price
5. When booking, send an array of service IDs in the appointment request

## Error Handling

The API will return the following error structure:

```javascript
{
  message: 'Error message describing what went wrong'
}
```

Implement proper error handling in your UI components to handle these error states gracefully.

## Performance Considerations

1. Use `type` parameter to only fetch required data
2. Use `limit` to control the amount of data returned
3. Consider caching popular searches on the client
4. Use proper loading/error states in the UI

## Debugging Tips

1. View the API response structure in browser developer tools
2. Check for multi-service flags in the response
3. Validate that professionals have the necessary services
4. Test edge cases like empty searches and single/multiple ID searches
