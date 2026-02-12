import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (!clerkSecretKey) {
    return res.status(500).json({ error: 'Clerk secret key missing' });
  }

  try {
    // Fetch users from Clerk API
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users from Clerk');
    }

    const clerkUsers = await response.json();

    // Transform Clerk user data to simpler format
    const users = clerkUsers.map((clerkUser: any) => ({
      id: clerkUser.id,
      name: clerkUser.first_name && clerkUser.last_name
        ? `${clerkUser.first_name} ${clerkUser.last_name}`
        : clerkUser.email_addresses?.[0]?.email_address || 'Unknown User',
      image: clerkUser.image_url || clerkUser.profile_image_url,
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}
