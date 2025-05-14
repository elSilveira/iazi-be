# Search and Appointment System Documentation

## Search Routes API Documentation

### Main Search Endpoint
`GET /api/search`

This endpoint provides a unified search functionality for professionals, services, and companies with their relationships. The search supports filtering, pagination, and sorting.

#### Query Parameters:
- `q` (string): Search term to filter results by name, role, etc.
- `category` (string): Category name to filter results
- `sort` (string): Sorting criteria (supports "rating" or "name")
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 10): Items per page
- `type` (string, enum: [all, professionals, services, companies]): Type of entity to search for
- `professionalTipo` (string): Type of professional to filter

#### Response Structure:
```json
{
  "professionals": [
    {
      "id": "uuid",
      "name": "Professional Name",
      "role": "Professional Role",
      "rating": 4.5,
      "services": [
        {
          "id": "uuid",
          "name": "Service Name",
          "duration": "PT1H30M",
          "price": 150.00,
          "description": "Service Description"
        }
      ]
    }
  ],
  "services": [
    {
      "id": "uuid",
      "name": "Service Name",
      "duration": "PT1H30M",
      "price": 150.00,
      "category": {
        "id": "uuid",
        "name": "Category Name"
      },
      "professionals": [
        {
          "id": "uuid",
          "name": "Professional Name"
        }
      ]
    }
  ],
  "companies": [
    {
      "id": "uuid",
      "name": "Company Name",
      "description": "Company Description",
      "categories": ["Category1", "Category2"],
      "address": {
        "street": "Street Name",
        "city": "City Name",
        "state": "State"
      }
    }
  ]
}
```

#### Search Logic Implementation:
1. **For professionals:**
   - Filters by name, role (case-insensitive)
   - Filters by service category
   - Filters by professional type (role)
   - Ensures professionals have at least one service

2. **For services:**
   - Returns services that have at least one professional
   - Includes related professionals, category, and company information

3. **For companies:**
   - Filters by name, description (case-insensitive)
   - Filters by categories
   - Supports pagination and sorting

## Professional Availability System

Once professionals are found through the search API, clients can check their availability for specific services using the appointment availability endpoints.

### Check Professional Availability
`GET /api/appointments/availability`

This endpoint allows checking when a professional is available for a specific service on a specific date.

#### Query Parameters:
- `date` (string, required): Date in YYYY-MM-DD format
- `serviceId` (uuid, required): ID of the service to check availability for
- `professionalId` (uuid): ID of the professional to check availability for
- `companyId` (uuid): Alternative to professionalId, check availability for all professionals in a company

#### Response Structure:
```json
// For a single professional
{
  "availableSlots": ["09:00", "09:15", "09:30", "10:00", "..."]
}

// For a company (multiple professionals)
{
  "availabilityByProfessional": {
    "professional-id-1": ["09:00", "09:15", "09:30", "..."],
    "professional-id-2": ["10:00", "10:15", "10:30", "..."]
  }
}
```

### Get Professional's Full Schedule
`GET /api/professionals/:id/availability`

This endpoint provides a comprehensive view of a professional's schedule for a specific day, including all services they offer and both available slots and booked appointments.

#### Query Parameters:
- `date` (string, required): Date in YYYY-MM-DD format

#### Response Structure:
```json
{
  "professionalId": "uuid",
  "date": "2023-06-15",
  "openHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "services": [
    {
      "serviceId": "uuid",
      "serviceName": "Service Name",
      "duration": "PT1H30M",
      "slots": ["09:00", "09:15", "09:30", "..."],
      "scheduled": [
        {
          "id": "uuid",
          "startTime": "11:00",
          "endTime": "12:30",
          "status": "CONFIRMED",
          "userId": "uuid"
        }
      ]
    }
  ]
}
```

## Multi-Service Appointments

The system supports booking appointments with multiple services in a single appointment. When searching for professionals and checking availability, the client can:

1. Find professionals that offer specific services using the search API
2. Check if the professional has enough available time for all requested services
3. Book an appointment with multiple services through the appointment creation endpoint

### Booking Process Flow:
1. Search for professionals using `/api/search` (filter by service category if needed)
2. Check professional availability for a specific service using `/api/appointments/availability`
3. Book appointment with one or multiple services using `POST /api/appointments`

This integration allows clients to find professionals, check their availability for specific services, and book appointments with all the selected services in a single transaction.
