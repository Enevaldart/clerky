import express from 'express';
import cors from 'cors';
import { StreamChat } from 'stream-chat';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables manually
try {
  const envPath = resolve('.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
  console.log('Environment variables loaded successfully');
} catch (error) {
  console.log('No .env file found, using process environment');
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Stream Chat credentials from environment variables
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

// Token generation endpoint
app.post('/api/stream-token', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      return res.status(500).json({ error: 'Stream credentials missing' });
    }

    const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
    const token = serverClient.createToken(userId);

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
