const express = require('express');
const router = express.Router();
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-routes');

// Mock authentication for testing
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // For testing purposes
    if (email === 'test@example.com' && password === 'password') {
      res.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        }
      });
    } else {
      res.status(401).json({
        error: {
          message: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'Error en el inicio de sesión',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

module.exports = router;
