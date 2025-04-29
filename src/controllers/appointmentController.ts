import { Request, Response } from 'express';
import { appointmentRepository } from '../repositories/appointmentRepository';
import { Prisma, AppointmentStatus } from '@prisma/client';

// Obter todos os agendamentos (com filtros opcionais)
export const getAllAppointments = async (req: Request, res: Response): Promise<Response> => {
  const { userId, professionalId, status } = req.query;
  
  try {
    let appointments;
    
    // Filtrar por usuário se userId for fornecido
    if (userId) {
      appointments = await appointmentRepository.findByUser(
        userId as string, 
        status as AppointmentStatus | undefined
      );
    } 
    // Filtrar por profissional se professionalId for fornecido
    else if (professionalId) {
      // Opcionalmente, poderia aceitar uma data para filtrar
      appointments = await appointmentRepository.findByProfessional(professionalId as string);
    } 
    // Caso contrário, retornar erro ou implementar busca geral (com paginação)
    else {
      return res.status(400).json({ message: 'É necessário fornecer userId ou professionalId para filtrar os agendamentos' });
    }
    
    return res.json(appointments);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter um agendamento específico pelo ID
export const getAppointmentById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  try {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    return res.json(appointment);
  } catch (error) {
    console.error(`Erro ao buscar agendamento ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Criar um novo agendamento
export const createAppointment = async (req: Request, res: Response): Promise<Response> => {
  const data: Prisma.AppointmentCreateInput = req.body;
  
  // Validação básica
  if (!data.date || !data.userId || !data.serviceId || !data.professionalId) {
    return res.status(400).json({ 
      message: 'Data, ID do usuário, ID do serviço e ID do profissional são obrigatórios' 
    });
  }

  try {
    // Verificar se a data é futura
    const appointmentDate = new Date(data.date);
    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: 'A data do agendamento deve ser futura' });
    }
    
    // Criar o agendamento
    const newAppointment = await appointmentRepository.create(data);
    return res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    // Verificar erros de chave estrangeira
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(400).json({ message: 'Um ou mais IDs fornecidos são inválidos.' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar o status de um agendamento
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Validar o status
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
    console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Cancelar um agendamento (caso especial de atualização de status)
export const cancelAppointment = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
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
    console.error(`Erro ao cancelar agendamento ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Deletar um agendamento (geralmente não recomendado, preferir cancelamento)
export const deleteAppointment = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

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
    console.error(`Erro ao deletar agendamento ${id}:`, error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
