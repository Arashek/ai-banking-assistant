import express from 'express';
import { Request, Response } from 'express';
import oauth2Service from '../services/oauth2Service';
import { User } from '../models/User';

const router = express.Router();

// Store PKCE verifiers temporarily (in production, use Redis or similar)
const codeVerifiers = new Map<string, { codeVerifier: string; userId: string }>();

// Initiate PSD2 authorization
router.get('/authorize', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { url, state, codeVerifier } = oauth2Service.getAuthorizationUrl(userId);
    
    // Store code verifier for later use
    codeVerifiers.set(state, { codeVerifier, userId });

    // Set expiry for the stored verifier (5 minutes)
    setTimeout(() => codeVerifiers.delete(state), 5 * 60 * 1000);

    res.json({ authorizationUrl: url });
  } catch (error) {
    console.error('Error initiating PSD2 authorization:', error);
    res.status(500).json({ message: 'Failed to initiate PSD2 authorization' });
  }
});

// Handle PSD2 callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const verifierData = codeVerifiers.get(state as string);
    if (!verifierData) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }

    const { codeVerifier, userId } = verifierData;
    codeVerifiers.delete(state as string);

    // Exchange code for token
    const token = await oauth2Service.exchangeCodeForToken(
      code as string,
      codeVerifier,
      userId
    );

    // Update user's PSD2 access status
    await User.findByIdAndUpdate(userId, {
      psd2Access: {
        enabled: true,
        lastAuthorized: new Date(),
      },
    });

    // Redirect to success page
    res.redirect('/psd2-connection-success');
  } catch (error) {
    console.error('Error handling PSD2 callback:', error);
    res.redirect('/psd2-connection-error');
  }
});

// Handle PSD2 error callback
router.get('/callback/error', (req: Request, res: Response) => {
  const { error, error_description } = req.query;
  console.error('PSD2 authorization error:', { error, error_description });
  res.redirect('/psd2-connection-error');
});

// Revoke PSD2 access
router.post('/revoke', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Clear tokens from cache
    oauth2Service.clearTokenCache(userId);

    // Update user's PSD2 access status
    await User.findByIdAndUpdate(userId, {
      psd2Access: {
        enabled: false,
        lastAuthorized: null,
      },
    });

    res.json({ message: 'PSD2 access revoked successfully' });
  } catch (error) {
    console.error('Error revoking PSD2 access:', error);
    res.status(500).json({ message: 'Failed to revoke PSD2 access' });
  }
});

export default router;
