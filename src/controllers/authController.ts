import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository';
import { Prisma } from '@prisma/client'; // Import Prisma types if needed for user creation later

// Chave secreta para JWT (em um ambiente real, use variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto';

// Função de Login Refatorada
export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    // Encontra o usuário no banco de dados pelo email usando o repositório
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Compara a senha fornecida com o hash armazenado no banco de dados
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Gera o token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h', // Token expira em 1 hora
    });

    // Retorna o token e os dados do usuário (sem a senha)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user; // Remove a senha do objeto retornado

    return res.json({
      message: 'Login bem-sucedido',
      token,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Função de Registro (Exemplo - pode ser movida para userController)
export const register = async (req: Request, res: Response): Promise<Response> => {
  const { email, name, password, avatar } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ message: 'Email, nome e senha são obrigatórios' });
  }

  try {
    // Verifica se o usuário já existe
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email já cadastrado' });
    }

    // Gera o hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Cria o usuário no banco de dados
    const newUser = await userRepository.create({
      email,
      name,
      password: hashedPassword,
      avatar,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser; // Remove a senha

    return res.status(201).json({ message: 'Usuário criado com sucesso', user: userWithoutPassword });

  } catch (error) {
    console.error('Erro no registro:', error);
    // Verifica se é um erro conhecido do Prisma (ex: violação de constraint única)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Código para unique constraint violation
        return res.status(409).json({ message: 'Email já cadastrado.' });
      }
    }
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

