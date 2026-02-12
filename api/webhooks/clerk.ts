import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';
import { StreamChat } from 'stream-chat';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const streamApiKey = process.env.STREAM_API_KEY;
  const streamApiSecret = process.env.STREAM_API_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret missing' });
  }

  if (!streamApiKey || !streamApiSecret) {
    return res.status(500).json({ error: 'Stream credentials missing' });
  }

  try {
    // Get headers
    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const eventType = evt.type;
    
    // Initialize Stream Chat client
    const serverClient = StreamChat.getInstance(streamApiKey, streamApiSecret);

    // Handle user events
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, first_name, last_name, email_addresses, image_url } = evt.data;

      // Update or create user in Stream Chat
      await serverClient.upsertUser({
        id: id,
        name: first_name && last_name
          ? `${first_name} ${last_name}`
          : email_addresses?.[0]?.email_address || 'Unknown User',
        image: image_url,
      });
      
      console.log(`User ${id} synced to Stream Chat`);
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      // Delete user from Stream Chat
      await serverClient.deleteUser(id, {
        mark_messages_deleted: true,
        hard_delete: true,
      });
      
      console.log(`User ${id} deleted from Stream Chat`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
