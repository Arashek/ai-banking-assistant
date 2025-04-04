const express = require('express');
const router = express.Router();
const { AIAssistantService } = require('../services/aiAssistantService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ai-routes');
const aiAssistant = new AIAssistantService();

// Process text query
router.post('/query', async (req, res) => {
  try {
    const { input, context } = req.body;
    const userId = req.user?.id || '1'; // Mock user ID for testing

    if (!input) {
      return res.status(400).json({
        error: {
          message: 'La consulta no puede estar vacía',
          code: 'EMPTY_QUERY'
        }
      });
    }

    const response = await aiAssistant.processQuery({
      userId,
      input,
      context
    });

    res.json(response);
  } catch (error) {
    logger.error('Error processing AI query:', error);
    res.status(500).json({
      error: {
        message: 'Error al procesar la consulta',
        code: 'AI_PROCESSING_ERROR'
      }
    });
  }
});

module.exports = router;
