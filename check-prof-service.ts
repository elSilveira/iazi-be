import { prisma } from "./src/lib/prisma";

async function checkRelationship() {
  try {
    // Check if professional exists
    const professional = await prisma.professional.findUnique({
      where: { id: "6f03bcd8-fcb4-478a-aa5f-ce0be464dbc3" },
    });
    console.log("Professional exists:", !!professional);
    
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: "fe4802eb-489f-4bca-81b2-af25f1520fb0" },
    });
    console.log("Service exists:", !!service);
    
    // Check relationship
    const relationship = await prisma.professionalService.findUnique({
      where: { 
        professionalId_serviceId: {
          professionalId: "6f03bcd8-fcb4-478a-aa5f-ce0be464dbc3",
          serviceId: "fe4802eb-489f-4bca-81b2-af25f1520fb0"
        }
      },
    });
    console.log("Relationship exists:", !!relationship);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationship();
