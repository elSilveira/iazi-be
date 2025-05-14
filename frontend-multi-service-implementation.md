# Multi-Service Appointment Implementation Guide

This guide provides instructions for implementing multi-service appointments in the frontend application, working with the backend's search and appointment APIs.

## 1. Search for Professionals & Services

### Search Endpoint
`GET /api/search`

### Implementation Steps
1. Create a search component that queries the `/api/search` endpoint with appropriate filters:
   ```javascript
   async function searchProfessionals(query, category, type = 'professionals') {
     const response = await fetch(
       `/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&type=${type}`
     );
     return response.json();
   }
   ```

2. Display search results with service information:
   ```javascript
   function renderProfessionalCard(professional) {
     return (
       <div className="professional-card">
         <h3>{professional.name}</h3>
         <p>{professional.role}</p>
         <div className="services">
           {professional.services.map(service => (
             <div key={service.id} className="service-item">
               <span>{service.name}</span>
               <span>{formatDuration(service.duration)}</span>
               <span>${service.price.toFixed(2)}</span>
               <button onClick={() => selectService(professional.id, service.id)}>Select</button>
             </div>
           ))}
         </div>
       </div>
     );
   }
   ```

## 2. Service Selection & Cart Management

### Implementation Steps
1. Create a service selection cart to track multiple services:

   ```javascript
   // Service cart state
   const [selectedServices, setSelectedServices] = useState([]);
   
   // Add service to cart
   function selectService(professionalId, serviceId, serviceName, duration, price) {
     setSelectedServices([
       ...selectedServices,
       {
         professionalId,
         serviceId,
         serviceName,
         duration,
         price
       }
     ]);
   }
   
   // Remove service from cart
   function removeService(index) {
     setSelectedServices(selectedServices.filter((_, i) => i !== index));
   }
   
   // Calculate total duration and price
   function calculateTotals() {
     return selectedServices.reduce(
       (acc, service) => {
         return {
           duration: acc.duration + parseDuration(service.duration),
           price: acc.price + service.price
         };
       },
       { duration: 0, price: 0 }
     );
   }
   ```

2. Display the service cart:
   ```javascript
   function renderServiceCart() {
     const totals = calculateTotals();
     
     return (
       <div className="service-cart">
         <h3>Selected Services</h3>
         {selectedServices.length === 0 ? (
           <p>No services selected</p>
         ) : (
           <>
             {selectedServices.map((service, index) => (
               <div key={index} className="cart-item">
                 <span>{service.serviceName}</span>
                 <span>${service.price.toFixed(2)}</span>
                 <button onClick={() => removeService(index)}>Remove</button>
               </div>
             ))}
             <div className="cart-totals">
               <p>Total Duration: {formatDuration(totals.duration)}</p>
               <p>Total Price: ${totals.price.toFixed(2)}</p>
             </div>
           </>
         )}
       </div>
     );
   }
   ```

## 3. Check Availability

### Availability Endpoint
`GET /api/appointments/availability`

### Implementation Steps
1. Check availability for the selected professional and services:

   ```javascript
   async function checkAvailability(professionalId, serviceId, date) {
     const response = await fetch(
       `/api/appointments/availability?professionalId=${professionalId}&serviceId=${serviceId}&date=${date}`
     );
     return response.json();
   }
   ```

2. Display available time slots:
   ```javascript
   function renderTimeSlots(availableSlots) {
     return (
       <div className="time-slots">
         <h3>Available Times</h3>
         <div className="slots-grid">
           {availableSlots.map((slot, index) => (
             <button 
               key={index} 
               onClick={() => selectTimeSlot(slot)}
               className="time-slot-btn"
             >
               {slot}
             </button>
           ))}
         </div>
       </div>
     );
   }
   ```

## 4. Booking an Appointment with Multiple Services

### Booking Endpoint
`POST /api/appointments`

### Implementation Steps
1. Create the appointment booking function:

   ```javascript
   async function bookAppointment(data) {
     const response = await fetch('/api/appointments', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${authToken}`
       },
       body: JSON.stringify(data)
     });
     return response.json();
   }
   ```

2. Submit the appointment with multiple services:
   ```javascript
   function handleBookingSubmit() {
     // Format services array for the API
     const servicesList = selectedServices.map(service => ({
       serviceId: service.serviceId,
       // Optional custom price if the frontend allows overrides
       price: service.customPrice || service.price 
     }));
     
     const appointmentData = {
       professionalId: selectedProfessional.id,
       startTime: `${selectedDate}T${selectedTimeSlot}:00`,
       services: servicesList,
       notes: bookingNotes
     };
     
     bookAppointment(appointmentData)
       .then(response => {
         // Handle successful booking
         showSuccessMessage(response);
         navigateToConfirmation(response.id);
       })
       .catch(error => {
         // Handle errors
         showErrorMessage(error);
       });
   }
   ```

## 5. Helper Functions

### Duration Parser
```javascript
// Parse duration string (e.g., "PT1H30M") to minutes
function parseDuration(durationString) {
  if (!durationString) return 0;
  
  const match = durationString.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) {
    // Fallback for simple formats
    let totalMinutes = 0;
    const hourMatch = durationString.match(/(\d+)h/);
    const minMatch = durationString.match(/(\d+)m/);
    
    if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    
    return totalMinutes > 0 ? totalMinutes : 0;
  }
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  
  return hours * 60 + minutes;
}

// Format minutes as human-readable duration
function formatDuration(minutes) {
  if (typeof minutes !== 'number') {
    minutes = parseDuration(minutes);
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  let result = '';
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (mins > 0 || hours === 0) {
    result += `${mins}m`;
  }
  
  return result.trim();
}
```

## 6. UI Implementation Examples

### Date Picker Component
```jsx
function DatePicker({ onDateSelect }) {
  const [selectedDate, setSelectedDate] = useState('');
  
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    onDateSelect(newDate);
  };
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="date-picker">
      <label htmlFor="appointment-date">Select Date:</label>
      <input
        type="date"
        id="appointment-date"
        min={today}
        value={selectedDate}
        onChange={handleDateChange}
      />
    </div>
  );
}
```

### Professional Selection with Services
```jsx
function ProfessionalSelector({ professionals, onServiceSelect }) {
  return (
    <div className="professional-selector">
      <h2>Select Professional & Services</h2>
      
      {professionals.map(professional => (
        <div key={professional.id} className="professional-card">
          <div className="professional-info">
            <h3>{professional.name}</h3>
            <p>{professional.role}</p>
            {professional.rating && (
              <div className="rating">{professional.rating} ⭐</div>
            )}
          </div>
          
          <div className="services-list">
            <h4>Available Services:</h4>
            {professional.services.map(service => (
              <div key={service.id} className="service-item">
                <div className="service-details">
                  <div className="service-name">{service.name}</div>
                  <div className="service-duration">{formatDuration(service.duration)}</div>
                  <div className="service-price">${service.price.toFixed(2)}</div>
                </div>
                <button 
                  className="select-btn"
                  onClick={() => onServiceSelect(professional, service)}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 7. Error Handling

Always include proper error handling for API requests:

```javascript
async function handleAPIRequest(apiCall) {
  try {
    showLoadingIndicator();
    const result = await apiCall();
    hideLoadingIndicator();
    return result;
  } catch (error) {
    hideLoadingIndicator();
    
    // Check for network errors
    if (!navigator.onLine) {
      showErrorMessage('You appear to be offline. Please check your internet connection.');
      return null;
    }
    
    // Handle authentication errors
    if (error.status === 401) {
      showErrorMessage('Your session has expired. Please login again.');
      redirectToLogin();
      return null;
    }
    
    // Handle other errors
    showErrorMessage('Something went wrong. Please try again later.');
    console.error('API Error:', error);
    return null;
  }
}
```

## 8. Implementation Checklist

1. [ ] Create search component with filters
2. [ ] Implement service selection and cart functionality
3. [ ] Add professional availability checking
4. [ ] Create date and time selection components
5. [ ] Implement appointment booking with multiple services
6. [ ] Add error handling for all API calls
7. [ ] Implement confirmation and success screens
8. [ ] Add navigation between booking steps
9. [ ] Create appointment management screens
10. [ ] Add appointment cancellation functionality
