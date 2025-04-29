import { Request, Response } from "express";
import { appointmentRepository } from '../repositories/appointmentRepository';
import { Prisma, AppointmentStatus } from "@prisma/client";

// Helper function for UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};

// Função auxiliar para tratamento de erros
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço ou profissional) são inválidos.' });
    }
    if (error.code === 'P2025') {
      console.error("Prisma Error P2025: Record not found.");
      // O repositório deve retornar null, e o controlador deve tratar isso com 404
    }
  }
  return res.status(500).json({ message: 'Erro interno do servidor' });
};

// Obter todos os agendamentos (com filtros opcionais)
export const getAllAppointments = async (req: Request, res: Response): Promise<Response> => {
  const { userId, professionalId, status } = req.query;

  // Validar IDs se fornecidos
  if (userId && !isValidUUID(userId as string)) {
    return res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
  }
  if (professionalId && !isValidUUID(professionalId as string)) {
    return res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
  }
  // Validar status se fornecido
  if (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
     return res.status(400).json({ 
      message: 'Status inválido. Valores permitidos: ' + Object.values(AppointmentStatus).join(', ') 
    });
  }
  
  try {
    let appointments;
    
    if (userId) {
      appointments = await appointmentRepository.findByUser(
        userId as string, 
        status as AppointmentStatus | undefined
      );
    } 
    else if (professionalId) {
      appointments = await appointmentRepository.findByProfessional(professionalId as string);
    } 
    else {
      // Permitir buscar todos? Ou exigir filtro?
      // Por enquanto, vamos exigir um filtro para evitar retornar muitos dados
      return res.status(400).json({ message: 'É necessário fornecer userId ou professionalId para filtrar os agendamentos' });
    }
    
    return res.json(appointments);
  } catch (error) {
    return handleError(res, error, 'Erro ao buscar agendamentos:');
  }
};

// Obter um agendamento específico pelo ID
export const getAppointmentById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  
  try {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    return res.json(appointment);
  } catch (error) {
    return handleError(res, error, `Erro ao buscar agendamento ${id}:`);
  }
};

// Criar um novo agendamento
export const createAppointment = async (req: Request, res: Response): Promise<Response> => {
  // Extrair dados do corpo da requisição
  const { date, userId, serviceId, professionalId, notes } = req.body;

  // Validação básica de entrada
  if (!date || !userId || !serviceId || !professionalId) {
    return res.status(400).json({ 
      message: 'Data, ID do usuário, ID do serviço e ID do profissional são obrigatórios' 
    });
  }
  // Validar formato dos IDs
  if (!isValidUUID(userId)) {
    return res.status(400).json({ message: 'Formato de ID do usuário inválido.' });
  }
  if (!isValidUUID(serviceId)) {
    return res.status(400).json({ message: 'Formato de ID do serviço inválido.' });
  }
  if (!isValidUUID(professionalId)) {
    return res.status(400).json({ message: 'Formato de ID do profissional inválido.' });
  }

  try {
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: 'Formato de data inválido.' });
    }
    // Permitir agendamentos no mesmo dia, mas não no passado?
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Comparar apenas a data
    if (appointmentDate < now) {
      return res.status(400).json({ message: 'A data do agendamento não pode ser no passado' });
    }

    // Montar o objeto de dados para o Prisma usando 'connect'
    const dataToCreate: Prisma.AppointmentCreateInput = {
      date: appointmentDate,
      user: { connect: { id: userId } },
      service: { connect: { id: serviceId } },
      professional: { connect: { id: professionalId } },
      notes: notes, // notes é opcional
      // status é definido por padrão no schema
    };
    
    const newAppointment = await appointmentRepository.create(dataToCreate);
    return res.status(201).json(newAppointment);
  } catch (error) {
    return handleError(res, error, 'Erro ao criar agendamento:');
  }
};

// Atualizar o status de um agendamento
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  const { status } = req.body;
  
  if (!status || !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    return res.status(400).json({ 
      message: 'Status inválido. Valores permitidos: ' + Object.values(AppointmentStatus).join(', ') 
    });
  }

  try {
    const updatedAppointment = await appointmentRepository.updateStatus(id, status as AppointmentStatus);
    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Agendamento não encontrado para atualização' });
    }
    return res.json(updatedAppointment);
  } catch (error) {
    return handleError(res, error, `Erro ao atualizar status do agendamento ${id}:`);
  }
};

// Cancelar um agendamento (caso especial de atualização de status)
export const cancelAppointment = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }
  
  try {
    const updatedAppointment = await appointmentRepository.updateStatus(id, AppointmentStatus.CANCELLED);
    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Agendamento não encontrado para cancelamento' });
    }
    return res.json({ 
      message: 'Agendamento cancelado com sucesso', 
      appointment: updatedAppointment 
    });
  } catch (error) {
    return handleError(res, error, `Erro ao cancelar agendamento ${id}:`);
  }
};

// Deletar um agendamento (geralmente não recomendado, preferir cancelamento)
export const deleteAppointment = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  // Validar formato do ID
  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Formato de ID inválido." });
  }

  try {
    const deletedAppointment = await appointmentRepository.delete(id);
    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Agendamento não encontrado para exclusão' });
    }
    return res.status(200).json({ 
      message: 'Agendamento excluído com sucesso', 
      appointment: deletedAppointment 
    });
  } catch (error) {
    return handleError(res, error, `Erro ao deletar agendamento ${id}:`);
  }
};

