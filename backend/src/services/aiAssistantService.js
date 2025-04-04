const { OpenAI } = require('openai');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ai-assistant-service');

class AIAssistantService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.systemPrompt = `Eres un asistente bancario AI que ayuda a los clientes con sus consultas bancarias en español.
    Puedes ayudar con:
    - Consultas de saldo
    - Transferencias
    - Análisis de gastos
    - Historial de transacciones
    - Consejos financieros
    
    Responde siempre en español de manera profesional y amigable.`;
  }

  async processQuery({ userId, input, context = {} }) {
    try {
      logger.info('Processing query', { userId, input });

      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: input }
      ];

      if (context.previousMessages) {
        messages.splice(1, 0, ...context.previousMessages);
      }

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content;
      
      // Parse banking actions from the response
      const actions = this.parseBankingActions(response);

      logger.info('Query processed successfully', { userId });

      return {
        response,
        actions,
      };
    } catch (error) {
      logger.error('Error processing query:', error);
      throw error;
    }
  }

  parseBankingActions(response) {
    const actions = [];
    
    // Check for balance inquiry
    if (response.toLowerCase().includes('saldo') || response.toLowerCase().includes('balance')) {
      actions.push({ type: 'GET_BALANCE' });
    }
    
    // Check for transaction history request
    if (response.toLowerCase().includes('transacciones') || response.toLowerCase().includes('movimientos')) {
      actions.push({ type: 'GET_TRANSACTIONS' });
    }
    
    // Check for transfer request
    const transferMatch = response.match(/transferir?|enviar?\s+(\d+)\s*(?:€|EUR)?\s+(?:a|para)\s+([^\s.,]+)/i);
    if (transferMatch) {
      actions.push({
        type: 'MAKE_TRANSFER',
        amount: parseFloat(transferMatch[1]),
        recipient: transferMatch[2],
      });
    }
    
    // Check for spending analysis
    if (response.toLowerCase().includes('gastos') || response.toLowerCase().includes('gastado')) {
      actions.push({ type: 'ANALYZE_SPENDING' });
    }
    
    return actions;
  }
}

module.exports = {
  AIAssistantService,
};
