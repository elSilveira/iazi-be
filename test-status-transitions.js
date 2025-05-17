// Testar transições de status de agendamento
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuração
const API_URL = 'http://localhost:3002';
let token = '';

// Função para obter token de autenticação (admin)
async function login() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    token = response.data.accessToken;
    console.log('✓ Login realizado com sucesso');
    return token;
  } catch (error) {
    console.error('✕ Erro no login:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Função para testar a transição de status direta
async function testAppointmentStatusTransition() {
  try {
    // Assumindo que existe um agendamento com este ID (substitua por um ID real do seu banco)
    const appointmentId = 'SUBSTITUIR_COM_ID_REAL';
    
    // Definir diretamente para COMPLETED (pular estados intermediários)
    const response = await axios.patch(
      `${API_URL}/api/appointments/${appointmentId}/status`,
      { status: 'COMPLETED' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✓ Transição direta para COMPLETED realizada com sucesso');
    console.log('Detalhes do agendamento atualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('✕ Erro na transição de status:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar todas as transições possíveis
async function testAllTransitions() {
  try {
    // Assumindo que existe um agendamento com este ID (substitua por um ID real do seu banco)
    const appointmentId = 'SUBSTITUIR_COM_ID_REAL';
    const statuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'NO_SHOW', 'PENDING'];
    
    for (const status of statuses) {
      try {
        console.log(`\nTestando transição para ${status}...`);
        const response = await axios.patch(
          `${API_URL}/api/appointments/${appointmentId}/status`,
          { status },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ Transição para ${status} realizada com sucesso`);
      } catch (error) {
        console.error(`✕ Erro na transição para ${status}:`, error.response?.data || error.message);
      }
    }
  } catch (error) {
    console.error('✕ Erro geral:', error.message);
  }
}

// Executar testes
async function runTests() {
  await login();
  console.log('\n=== Teste de Transição Direta ===');
  await testAppointmentStatusTransition();
  console.log('\n=== Teste de Todas as Transições ===');
  await testAllTransitions();
}

runTests();
