import express from 'express';
import cors from 'cors';
import { StreamChat } from 'stream-chat';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Stream Chat credentials (you should move these to environment variables)
const STREAM_API_KEY = process.env.STREAM_API_KEY || 'jrc9qhde62zc';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || 'your-secret-key-here';

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
