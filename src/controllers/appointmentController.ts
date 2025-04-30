import { Request, Response, NextFunction } from "express"; // Import NextFunction
import { appointmentRepository } from '../repositories/appointmentRepository';
import { Prisma, AppointmentStatus } from "@prisma/client";

// Extend Express Request type to include user property from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    // Add other user properties if needed from the token payload
  };
}

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Obter todos os agendamentos (com filtros opcionais)
export const getAllAppointments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => { // Use AuthenticatedRequest
  const { professionalId, status } = req.query;
  let userId = req.query.userId as string | undefined;

  // If userId query param is not provided, try to get it from the authenticated user
  if (!userId && req.user?.id) {
    userId = req.user.id;
  }

  // Validar IDs se fornecidos
  if (userId && !isValidUUID(userId)) {
    res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
    return;
  }
  if (professionalId && !isValidUUID(professionalId as string)) {
    res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
    return;
  }
  // Validar status se fornecido
  if (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
     res.status(400).json({ 
      message: 'Status inválido. Valores permitidos: ' + Object.values(AppointmentStatus).join(', ') 
    });
    return;
  }
  
  try {
    let appointments;
    
    // Simplificando a lógica de busca - o repositório pode lidar com filtros
    const filters: Prisma.AppointmentWhereInput = {};
    if (userId) filters.userId = userId;
    if (professionalId) filters.professionalId = professionalId as string;
    if (status) filters.status = status as AppointmentStatus;

    // Se nenhum filtro principal for fornecido (nem userId da query/token, nem professionalId), retornar erro.
    if (!userId && !professionalId) {
        res.status(400).json({ message: 'É necessário fornecer userId (ou estar autenticado) ou professionalId para filtrar os agendamentos' });
        return;
    }

    appointments = await appointmentRepository.findMany(filters);
    
    res.json(appointments);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    next(error); // Pass error to error handler
  }
};

// Obter um agendamento específico pelo ID
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  
  try {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Agendamento não encontrado' });
      return;
    }
    res.json(appointment);
  } catch (error) {
    console.error(`Erro ao buscar agendamento ${id}:`, error);
    next(error); // Pass error to error handler
  }
};

// Criar um novo agendamento
export const createAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => { // Use AuthenticatedRequest
  // Extrair dados do corpo da requisição
  const { date, serviceId, professionalId, notes } = req.body;
  const userId = req.user?.id; // Get userId from authenticated user

  // Validação (Idealmente feita com express-validator)
  if (!date || !serviceId || !professionalId) {
    res.status(400).json({ 
      message: 'Data, ID do serviço e ID do profissional são obrigatórios' 
    });
    return;
  }
  if (!userId) { // Check if userId was obtained from token
      res.status(401).json({ message: 'Usuário não autenticado.' });
      return;
  }
  if (!isValidUUID(serviceId) || !isValidUUID(professionalId)) {
    res.status(400).json({ message: 'Formato de ID inválido para serviço ou profissional.' });
    return;
  }

  try {
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      res.status(400).json({ message: 'Formato de data inválido.' });
      return;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    if (appointmentDate < now) {
      res.status(400).json({ message: 'A data do agendamento não pode ser no passado' });
      return;
    }

    const dataToCreate: Prisma.AppointmentCreateInput = {
      date: appointmentDate,
      user: { connect: { id: userId } }, // Use userId from token
      service: { connect: { id: serviceId } },
      professional: { connect: { id: professionalId } },
      notes: notes,
    };
    
    const newAppointment = await appointmentRepository.create(dataToCreate);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      // Check which foreign key constraint failed
      const target = (error.meta as any)?.target;
      if (target && target.includes('userId')) {
          res.status(400).json({ message: 'ID do usuário inválido.' });
      } else if (target && target.includes('serviceId')) {
          res.status(400).json({ message: 'ID do serviço inválido.' });
      } else if (target && target.includes('professionalId')) {
          res.status(400).json({ message: 'ID do profissional inválido.' });
      } else {
          res.status(400).json({ message: 'Um ou mais IDs fornecidos são inválidos.' });
      }
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // This can happen if serviceId or professionalId doesn't exist
        res.status(404).json({ message: 'Serviço ou Profissional não encontrado.' });
        return;
    }
    next(error); // Pass other errors to error handler
  }
};

// Atualizar o status de um agendamento
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  const { status } = req.body;
  
  if (!status || !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    res.status(400).json({ 
      message: 'Status inválido. Valores permitidos: ' + Object.values(AppointmentStatus).join(', ') 
    });
    return;
  }

  try {
    // TODO: Add authorization check - does the authenticated user own this appointment or is a professional/admin?
    const updatedAppointment = await appointmentRepository.updateStatus(id, status as AppointmentStatus);
    if (!updatedAppointment) {
      res.status(404).json({ message: 'Agendamento não encontrado para atualização' });
      return;
    }
    res.json(updatedAppointment);
  } catch (error) {
    console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Agendamento não encontrado para atualização.' });
      return;
    }
    next(error); // Pass other errors to error handler
  }
};

// Cancelar um agendamento (caso especial de atualização de status)
export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }
  
  try {
    // TODO: Add authorization check - does the authenticated user own this appointment?
    const updatedAppointment = await appointmentRepository.updateStatus(id, AppointmentStatus.CANCELLED);
    if (!updatedAppointment) {
      res.status(404).json({ message: 'Agendamento não encontrado para cancelamento' });
      return;
    }
    res.json({ 
      message: 'Agendamento cancelado com sucesso', 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error(`Erro ao cancelar agendamento ${id}:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Agendamento não encontrado para cancelamento.' });
      return;
    }
    next(error); // Pass other errors to error handler
  }
};

// Deletar um agendamento (geralmente não recomendado, preferir cancelamento)
export const deleteAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Added next, void return
  const { id } = req.params;
  if (!isValidUUID(id)) {
    res.status(400).json({ message: "Formato de ID inválido." });
    return;
  }

  try {
    // TODO: Add authorization check - does the authenticated user own this appointment?
    const deletedAppointment = await appointmentRepository.delete(id);
    if (!deletedAppointment) {
      res.status(404).json({ message: 'Agendamento não encontrado para exclusão' });
      return;
    }
    // Use 204 No Content for successful deletion
    res.status(204).send(); 
  } catch (error) {
    console.error(`Erro ao deletar agendamento ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Agendamento não encontrado para exclusão.' });
      return;
    }
    next(error); // Pass other errors to error handler
  }
};

