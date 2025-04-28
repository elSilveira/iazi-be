import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Chave secreta para JWT (em um ambiente real, use variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto';

// Mock de usuário para teste
const mockUserDb: User[] = [
  {
    id: 'user-123',
    name: 'Usuário Teste Backend',
    email: 'teste@exemplo.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
];

export const login = (req: Request, res: Response): Response<any, Record<string, any>> => { // Explicit return type (simplified to Response for consistency)
  const { email, password } = req.body;

  // Validação básica (em um ambiente real, verifique o hash da senha)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  // Encontra o usuário mockado pelo email
  const user = mockUserDb.find((u) => u.email === email);

  // Simula verificação de senha (em um ambiente real, compare hashes)
  if (user && password === 'senha123') { // Senha mockada para teste
    // Gera o token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h', // Token expira em 1 hora
    });

    // Retorna o token e os dados do usuário (sem a senha)
    return res.json({ // Added return
      message: 'Login bem-sucedido',
      token,
      user: { 
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } else {
    return res.status(401).json({ message: 'Email ou senha inválidos' }); // Added return
  }
};

