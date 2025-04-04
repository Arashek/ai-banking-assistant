const express = require('express');
const router = express.Router();
const { createLogger } = require('../utils/logger');

const logger = createLogger('banking-routes');

// Mock data for testing
const mockAccounts = [
  {
    id: '1',
    type: 'Cuenta Corriente',
    balance: 1500.00,
    currency: 'EUR',
    iban: 'ES9121000418450200051332'
  }
];

const mockTransactions = [
  {
    id: '1',
    date: '2025-04-03',
    description: 'Supermercado El Corte Inglés',
    amount: -45.67,
    category: 'groceries',
    type: 'debit'
  },
  {
    id: '2',
    date: '2025-04-02',
    description: 'Nómina Empresa SA',
    amount: 2100.00,
    category: 'salary',
    type: 'credit'
  }
];

// Get accounts
router.get('/accounts', (req, res) => {
  try {
    res.json(mockAccounts);
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    res.status(500).json({
      error: {
        message: 'Error al obtener las cuentas',
        code: 'ACCOUNTS_ERROR'
      }
    });
  }
});

// Get account balance
router.get('/accounts/balance', (req, res) => {
  try {
    const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
    res.json({ balance: totalBalance });
  } catch (error) {
    logger.error('Error fetching balance:', error);
    res.status(500).json({
      error: {
        message: 'Error al obtener el saldo',
        code: 'BALANCE_ERROR'
      }
    });
  }
});

// Get transactions
router.get('/transactions', (req, res) => {
  try {
    const { limit = 10, category } = req.query;
    let filteredTransactions = [...mockTransactions];
    
    if (category) {
      filteredTransactions = filteredTransactions.filter(t => t.category === category);
    }
    
    res.json(filteredTransactions.slice(0, limit));
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      error: {
        message: 'Error al obtener las transacciones',
        code: 'TRANSACTIONS_ERROR'
      }
    });
  }
});

// Create transfer
router.post('/transfers', (req, res) => {
  try {
    const { amount, recipient, concept } = req.body;
    
    // Mock transfer creation
    const transfer = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: -amount,
      recipient,
      concept,
      status: 'completed'
    };
    
    res.status(201).json(transfer);
  } catch (error) {
    logger.error('Error creating transfer:', error);
    res.status(500).json({
      error: {
        message: 'Error al realizar la transferencia',
        code: 'TRANSFER_ERROR'
      }
    });
  }
});

// Analyze spending
router.get('/transactions/analysis', (req, res) => {
  try {
    const { category, period = 'month' } = req.query;
    
    // Mock spending analysis
    const analysis = {
      total: 1234.56,
      category: category || 'all',
      period,
      breakdown: {
        groceries: 345.67,
        transport: 123.45,
        entertainment: 234.56,
      }
    };
    
    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing spending:', error);
    res.status(500).json({
      error: {
        message: 'Error al analizar los gastos',
        code: 'ANALYSIS_ERROR'
      }
    });
  }
});

module.exports = router;
