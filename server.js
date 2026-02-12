//server.js
import express from 'express';
import cors from 'cors';
import { StreamChat } from 'stream-chat';
import { Webhook } from 'svix';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Stream Chat credentials from environment variables
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Initialize Stream Chat server client
let serverClient;
if (STREAM_API_KEY && STREAM_API_SECRET) {
  serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
}

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

    if (!serverClient) {
      return res.status(500).json({ error: 'Stream client not initialized' });
    }

    const token = serverClient.createToken(userId);

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Get all Clerk users endpoint
app.get('/api/users', async (req, res) => {
  try {
    if (!CLERK_SECRET_KEY) {
      return res.status(500).json({ error: 'Clerk secret key missing' });
    }

    // Fetch users from Clerk
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users from Clerk');
    }

    const clerkUsers = await response.json();

    // Transform Clerk user data to simpler format
    const users = clerkUsers.map((clerkUser) => ({
      id: clerkUser.id,
      name: clerkUser.first_name && clerkUser.last_name
        ? `${clerkUser.first_name} ${clerkUser.last_name}`
        : clerkUser.email_addresses?.[0]?.email_address || 'Unknown User',
      image: clerkUser.image_url || clerkUser.profile_image_url,
    }));

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Clerk webhook endpoint to sync users with Stream Chat
app.post('/api/webhooks/clerk', async (req, res) => {
  try {
    if (!CLERK_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Webhook secret missing' });
    }

    const webhookSecret = CLERK_WEBHOOK_SECRET;
    const headers = req.headers;
    const payload = req.body;

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let evt;

    try {
      evt = wh.verify(JSON.stringify(payload), {
        'svix-id': headers['svix-id'],
        'svix-timestamp': headers['svix-timestamp'],
        'svix-signature': headers['svix-signature'],
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const eventType = evt.type;
    
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, first_name, last_name, email_addresses, image_url } = evt.data;

      // Update or create user in Stream Chat
      if (serverClient) {
        await serverClient.upsertUser({
          id: id,
          name: first_name && last_name
            ? `${first_name} ${last_name}`
            : email_addresses?.[0]?.email_address || 'Unknown User',
          image: image_url,
        });
        console.log(`User ${id} synced to Stream Chat`);
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      // Delete user from Stream Chat
      if (serverClient) {
        await serverClient.deleteUser(id, {
          mark_messages_deleted: true,
          hard_delete: true,
        });
        console.log(`User ${id} deleted from Stream Chat`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/stream-token - Generate Stream Chat token');
  console.log('  GET /api/users - Fetch all Clerk users');
  console.log('  POST /api/webhooks/clerk - Clerk webhook handler');
});
