# Multi-Service Appointment Implementation Notes

## Backend Architecture

### Data Model

The multi-service appointment system is built around several key entities:

1. **Professional**
   - Has many services through ProfessionalService join table
   - Each professional can set custom prices and descriptions for services

2. **Service**
   - Contains base information including duration, default price
   - Related to many professionals through ProfessionalService join table

3. **ProfessionalService** (Join table)
   - Contains the relationship between professionals and services
   - Can override service price and description per professional

4. **Appointment**
   - Has multiple services through AppointmentService join table
   - Contains appointment metadata (startTime, endTime, status)

5. **AppointmentService** (Join table)
   - Contains the relationship between appointments and services
   - Stores the actual price charged for each service at time of booking

### Service Pricing Strategy

The system implements a tiered pricing strategy:

1. Each service has a default base price in the Service table
2. Professionals can override this price in the ProfessionalService table
3. When booking, the professional's custom price is used if available, otherwise the default
4. The price is recorded in the AppointmentService table for historical records

### Duration Calculation

Service duration is stored as an ISO 8601 duration string (e.g., "PT1H30M"):

1. Each service has a defined duration
2. When booking multi-service appointments, the total duration is the sum of all service durations
3. The backend automatically calculates the endTime from the startTime + total duration
4. Duration strings are parsed using a utility function that handles various formats

Example duration parser:
```typescript
export const parseDuration = (durationString: string | null): number | null => {
    if (!durationString) return null;
    // ISO 8601 duration format (PTnHnM)
    const match = durationString.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
    if (!match) {
        // Fallback for simple formats like "30m", "1h", "1h30m" 
        let totalMinutes = 0;
        const hourMatch = durationString.match(/(\d+)h/);
        const minMatch = durationString.match(/(\d+)m/);
        if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
        if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
        return totalMinutes > 0 ? totalMinutes : null;
    }
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
};
```

## Search API Implementation

### Key Features of the Search API

1. **Unified Search**
   - Single endpoint returns professionals, services, and companies
   - Results can be filtered by type parameter

2. **Professional Search**
   - Filters by name, role, service categories
   - Returns professionals with their services
   - Services include professional-specific pricing and descriptions

3. **Service Mapping**
   ```typescript
   professionals = professionals.map(prof => {
     const mappedServices = prof.services.map((ps: any) => ({
       id: ps.service.id,
       name: ps.service.name,
       duration: ps.service.duration,
       price: ps.price || ps.service.price,
       description: ps.description || ps.service.description
     }));
     
     return {
       ...prof,
       services: mappedServices
     };
   });
   ```

## Availability Checking API

### Key Implementation Details

1. **Single Service Availability**
   - Takes serviceId, professionalId, and date
   - Returns time slots when the professional is available for that service

2. **Multi-Service Availability Logic**
   - For multi-service appointments, the frontend should:
     1. Check availability for the longest service first
     2. Verify the professional has enough continuous time for all services
     3. Book the appointment with the complete list of services

3. **Availability Calculation**
   - Working hours are checked first (professional or company level)
   - Existing appointments are checked for conflicts
   - Schedule blocks (time when professional is unavailable) are checked
   - Available slots are returned in 15-minute intervals

4. **Company-wide Availability**
   - When checking availability with only companyId, returns availability for all matching professionals
   - Useful for letting clients pick any available professional in a company

## Booking Process

### Creating a Multi-Service Appointment

1. **Request Format**
   ```json
   {
     "professionalId": "uuid",
     "startTime": "2023-06-10T14:00:00",
     "services": [
       { "serviceId": "service-uuid-1", "price": 100.00 },
       { "serviceId": "service-uuid-2", "price": 75.00 }
     ],
     "notes": "Optional booking notes"
   }
   ```

2. **Backend Processing**
   - Validates that the professional offers all the requested services
   - Calculates total duration and appointment end time
   - Checks for scheduling conflicts
   - Creates the appointment with multiple services
   - Returns the full appointment object with all services

3. **Conflict Detection**
   - Checks if the professional is already booked during the requested time
   - Validates that the services can be completed within working hours
   - Verifies there are no schedule blocks during the appointment time

## Technical Notes

### Performance Considerations

1. **Search API Optimization**
   - The search endpoint uses pagination to handle large result sets
   - Consider adding caching for frequently accessed search results

2. **Availability Calculation**
   - Availability calculation is computationally expensive
   - Consider implementing caching for availability results with short TTL (5-10 minutes)

3. **Database Indexing**
   - Ensure proper indexes on service lookup tables
   - Create indexes for common search patterns (name, category, etc.)

### Security Considerations

1. **Input Validation**
   - All user inputs are validated using express-validator
   - Duration strings are sanitized before parsing

2. **Authentication Requirements**
   - Search API: No authentication required
   - Availability checking: No authentication required
   - Appointment booking: Requires authenticated user

### Future Enhancements

1. **Service Bundling**
   - Implement special pricing for service bundles
   - Allow defining common service combinations with discounted rates

2. **Advanced Availability**
   - Implement waiting list functionality
   - Add buffer times between appointments
   - Support recurring appointment scheduling

3. **Optimization Ideas**
   - Precompute availability for popular professionals
   - Implement real-time availability updates using WebSockets
   - Add geographic search for professionals and companies
