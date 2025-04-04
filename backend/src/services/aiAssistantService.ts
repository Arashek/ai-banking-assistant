import OpenAI from 'openai';
import { createLogger } from '../utils/logger';
import { BankingService } from './bankingService';
import { TransactionService } from './transactionService';
import { User } from '../models/User';

const logger = createLogger('ai-assistant-service');

interface AIAssistantRequest {
  userId: string;
  input: string;
  context?: Record<string, any>;
}

interface AIAssistantResponse {
  text: string;
  action?: {
    type: string;
    params: Record<string, any>;
  };
}

export class AIAssistantService {
  private openai: OpenAI;
  private bankingService: BankingService;
  private transactionService: TransactionService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.bankingService = new BankingService();
    this.transactionService = new TransactionService();
  }

  private async generateSystemPrompt(userId: string): Promise<string> {
    const user = await User.findById(userId);
    const accounts = await this.bankingService.getAccounts(userId);
    
    return `Eres un asistente bancario AI que ayuda a los usuarios con sus consultas bancarias.
    Usuario actual: ${user?.name}
    Número de cuentas: ${accounts.length}
    
    Reglas:
    1. Responde siempre en español
    2. Sé conciso y profesional
    3. Para operaciones bancarias, requiere siempre confirmación explícita
    4. Menciona siempre los montos y destinatarios en operaciones monetarias
    5. No proporciones información sensible
    
    Formatos de respuesta:
    - Consulta de saldo: ACTION:CHECK_BALANCE
    - Transferencia: ACTION:TRANSFER{amount,recipient,concept}
    - Historial: ACTION:GET_TRANSACTIONS{count,filter}
    - Análisis de gastos: ACTION:ANALYZE_SPENDING{category,period}`;
  }

  private async parseResponse(completion: string): Promise<AIAssistantResponse> {
    const actionMatch = completion.match(/ACTION:([A-Z_]+)(?:{(.+)})?/);
    
    if (!actionMatch) {
      return { text: completion };
    }

    const [_, action, paramsString] = actionMatch;
    const params = paramsString ? 
      Object.fromEntries(
        paramsString.split(',')
          .map(param => param.split(':'))
      ) : {};

    return {
      text: completion.replace(/ACTION:[A-Z_]+(?:{.+})?/, '').trim(),
      action: {
        type: action,
        params
      }
    };
  }

  public async processQuery({ userId, input, context }: AIAssistantRequest): Promise<AIAssistantResponse> {
    try {
      const systemPrompt = await this.generateSystemPrompt(userId);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      const parsedResponse = await this.parseResponse(response);

      // Execute action if present
      if (parsedResponse.action) {
        await this.executeAction(userId, parsedResponse.action);
      }

      return parsedResponse;
    } catch (error) {
      logger.error('Error processing AI query', { error, userId, input });
      return {
        text: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, inténtalo de nuevo más tarde.'
      };
    }
  }

  private async executeAction(userId: string, action: { type: string; params: Record<string, any> }): Promise<void> {
    switch (action.type) {
      case 'CHECK_BALANCE':
        const accounts = await this.bankingService.getAccounts(userId);
        // Action will be handled by frontend
        break;

      case 'TRANSFER':
        // Only validate, actual transfer requires user confirmation
        await this.bankingService.validateTransfer(userId, {
          amount: parseFloat(action.params.amount),
          recipient: action.params.recipient,
          concept: action.params.concept
        });
        break;

      case 'GET_TRANSACTIONS':
        const count = parseInt(action.params.count) || 10;
        await this.transactionService.getTransactions(userId, {
          limit: count,
          filter: action.params.filter
        });
        break;

      case 'ANALYZE_SPENDING':
        await this.transactionService.analyzeSpending(userId, {
          category: action.params.category,
          period: action.params.period || 'month'
        });
        break;

      default:
        logger.warn('Unknown action type', { action });
    }
  }
}
