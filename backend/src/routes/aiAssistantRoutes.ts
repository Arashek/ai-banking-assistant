import express from 'express';
import { AIAssistantService } from '../services/aiAssistantService';
import { authenticateUser } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();
const logger = createLogger('ai-assistant-routes');
const aiAssistant = new AIAssistantService();

// Rate limiting for AI queries
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Demasiadas consultas al asistente. Por favor, inténtalo más tarde.'
});

// Process text query
router.post('/query', 
  authenticateUser,
  aiRateLimiter,
  async (req, res) => {
    try {
      const { input, context } = req.body;
      const userId = req.user?.id;

      if (!input) {
        return res.status(400).json({ 
          error: 'La consulta no puede estar vacía' 
        });
      }

      const response = await aiAssistant.processQuery({
        userId,
        input,
        context
      });

      res.json(response);
    } catch (error) {
      logger.error('Error processing AI query', { error });
      res.status(500).json({ 
        error: 'Error al procesar la consulta' 
      });
    }
});

// Process voice query (converts to text first)
router.post('/voice',
  authenticateUser,
  aiRateLimiter,
  async (req, res) => {
    try {
      const { audioData, context } = req.body;
      const userId = req.user?.id;

      if (!audioData) {
        return res.status(400).json({ 
          error: 'Los datos de audio no pueden estar vacíos' 
        });
      }

      // TODO: Implement speech-to-text conversion
      const input = ""; // Replace with actual speech-to-text result

      const response = await aiAssistant.processQuery({
        userId,
        input,
        context
      });

      res.json(response);
    } catch (error) {
      logger.error('Error processing voice query', { error });
      res.status(500).json({ 
        error: 'Error al procesar la consulta de voz' 
      });
    }
});

export default router;
