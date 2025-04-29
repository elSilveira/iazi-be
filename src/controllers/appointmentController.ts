import { Request, Response } from "express";
import { appointmentRepository } from '../repositories/appointmentRepository';
import { Prisma, AppointmentStatus } from "@prisma/client"; // Revertido: Importar de @prisma/client

// Função auxiliar para tratamento de erros
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Erros específicos do Prisma
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Um ou mais IDs fornecidos (usuário, serviço ou profissional) são inválidos.' });
    }
    if (error.code === 'P2025') {
      // Este erro geralmente indica que o registro não foi encontrado para update/delete
      // A lógica do repositório já retorna null, então o controlador trata isso
      // Mas podemos logar especificamente se quisermos
      console.error("Prisma Error P2025: Record not found.");
      // Não retornamos aqui, pois o controlador já trata o null
    }
    // Adicionar outros códigos de erro do Prisma conforme necessário
  }
  // Erro genérico
  return res.status(500).json({ message: 'Erro interno do servidor' });
};

// Obter todos os agendamentos (com filtros opcionais)
export const getAllAppointments = async (req: Request, res: Response): Promise<Response> => {
  const { userId, professionalId, status } = req.query;
  
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
  const data: Prisma.AppointmentCreateInput = req.body;
  
  if (!data.date || !data.userId || !data.serviceId || !data.professionalId) {
    return res.status(400).json({ 
      message: 'Data, ID do usuário, ID do serviço e ID do profissional são obrigatórios' 
    });
  }

  try {
    const appointmentDate = new Date(data.date);
    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: 'A data do agendamento deve ser futura' });
    }
    
    const newAppointment = await appointmentRepository.create(data);
    return res.status(201).json(newAppointment);
  } catch (error) {
    return handleError(res, error, 'Erro ao criar agendamento:');
  }
};

// Atualizar o status de um agendamento
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
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
    // O repositório já trata P2025 retornando null
    return handleError(res, error, `Erro ao deletar agendamento ${id}:`);
  }
};
