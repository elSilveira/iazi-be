# Multi-Service Appointments

Este documento descreve a implementação do suporte a agendamentos com múltiplos serviços na API ServiConnect.

## Visão Geral

A funcionalidade de agendamento com múltiplos serviços permite que usuários agendem vários serviços em um único compromisso, simplificando o processo de reserva e melhorando a experiência do usuário.

## Modelo de Dados

A estrutura de dados suporta agendamentos com múltiplos serviços através de:

1. **Appointment**: Entidade principal que contém os metadados do agendamento
2. **AppointmentService**: Tabela de junção que conecta agendamentos com serviços
3. **Service**: Detalhes dos serviços oferecidos

## API

### Criação de Agendamentos

A API suporta dois formatos para criação de agendamentos:

#### 1. Formato Novo (Múltiplos Serviços)

```json
{
  "date": "2023-10-15",
  "time": "14:30",
  "serviceIds": ["uuid-1", "uuid-2", "uuid-3"],
  "professionalId": "uuid-professional",
  "notes": "Observações opcionais"
}
```

#### 2. Formato Legado (Um Serviço)

```json
{
  "date": "2023-10-15",
  "time": "14:30",
  "serviceId": "uuid-service",
  "professionalId": "uuid-professional",
  "notes": "Observações opcionais"
}
```

O sistema aceita ambos os formatos para manter compatibilidade com clientes existentes.

### Validação

A API implementa validação robusta para:

1. Verificar se todos os IDs de serviços são válidos
2. Confirmar que o profissional oferece todos os serviços solicitados
3. Calcular a duração total e verificar disponibilidade
4. Normalizar internamente o formato legado para o novo formato

## Implementação Técnica

### Validadores

O sistema de validação realiza as seguintes verificações:

- Para `serviceIds`: Valida que é um array de UUIDs válidos
- Para `serviceId`: Valida que é um UUID válido e o converte para o formato `serviceIds` internamente
- Garante que pelo menos um dos campos (`serviceId` ou `serviceIds`) esteja presente

### Duração e Agendamento

- A duração total é calculada somando-se as durações de todos os serviços
- O horário de término é calculado somando a duração total ao horário de início
- A verificação de disponibilidade considera a duração total para evitar sobreposições

## Debug e Logs

Para diagnóstico em produção, o sistema implementa registros detalhados:

- Formato dos dados de entrada
- Validação de IDs de serviços
- Criação de agendamento
- Conversão entre formatos legado e novo

Os logs podem ser ativados em produção definindo a variável de ambiente `DEBUG=true`.

## Considerações de Frontend

Clientes frontend devem:

1. Migrar para o novo formato `serviceIds` sempre que possível
2. Implementar seleção de múltiplos serviços na interface
3. Calcular e exibir o tempo total e preço combinado dos serviços
4. Exibir todos os serviços reservados nas visualizações de detalhes do agendamento

## Testes

Os testes para esta funcionalidade incluem:

1. Testes de integração para criação com múltiplos serviços
2. Testes para verificar compatibilidade com o formato legado
3. Testes de validação para campos inválidos ou ausentes
4. Testes de cálculo de duração e disponibilidade
