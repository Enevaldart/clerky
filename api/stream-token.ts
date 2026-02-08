// api/stream-token.ts
import { Handler } from '@vercel/node'; // or just use NodeRequest if using plain
import { StreamChat } from 'stream-chat';

export const config = {
  runtime: 'nodejs18.x', // or edge if you prefer
};

const handler: Handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For security: in production, verify the request comes from your authenticated user
  // Here we use a simple header check or Clerk webhook/session – for quick start we'll assume it's called after login

  const userId = req.query.userId as string; // Pass userId from frontend (Clerk user.id)

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Stream credentials missing' });
  }

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);

  // Generate token (no expiry for simplicity, or add expiry: Math.floor(Date.now() / 1000) + 3600 for 1 hour)
  const token = serverClient.createToken(userId);

  return res.status(200).json({ token });
};

export default handler;
