# Chatty - Real-time Chat Application

A modern real-time chat application built with React, TypeScript, Vite, Clerk for authentication, and Stream Chat for messaging functionality.

## Features

- 🔐 **User Authentication** with Clerk
- 💬 **Real-time Messaging** with Stream Chat
- 🎨 **Modern UI** with Tailwind CSS
- 🔒 **Secure Token Generation** via backend API
- 📱 **Responsive Design**

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Clerk account and API keys
- Stream Chat account and API keys

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd my-clerk-app
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Stream Chat (Frontend)
VITE_STREAM_CHAT_API_KEY=your_stream_api_key_here

# Stream Chat (Backend - for server.js)
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_secret_key_here
```

**Where to get your keys:**

1. **Clerk Keys**: Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your Application → API Keys
2. **Stream Chat Keys**: Go to [Stream Dashboard](https://getstream.io/dashboard) → Your App → Keys

### 3. Start the Application

You need to run both the backend server and frontend application simultaneously.

#### Terminal 1: Start Backend Server
```bash
node server.js
```
You should see: `API server running on http://localhost:3001`

#### Terminal 2: Start Frontend Development Server
```bash
npm run dev
```
You should see: `Local: http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to: `http://localhost:5173`

## Usage

1. **Sign Up/Sign In**: Create an account or sign in with Clerk
2. **Join Chat**: Once signed in, you'll automatically join the "Everyone Chat" channel
3. **Start Messaging**: Send and receive real-time messages

## Project Structure

```
my-clerk-app/
├── src/
│   ├── App.tsx              # Main application component
│   ├── main.tsx            # Application entry point
│   └── assets/             # Static assets
├── server.js               # Backend API server for token generation
├── api/
│   └── stream-token.ts     # Vercel deployment API route
├── .env                   # Environment variables (DO NOT COMMIT)
├── .gitignore             # Git ignore file
└── package.json           # Dependencies and scripts
```

## Security Notes

- ⚠️ **Never commit `.env` files** to version control
- 🔒 All sensitive credentials are stored in environment variables
- 🛡️ Stream Chat tokens are generated server-side for security
- 📝 `.env` files are already included in `.gitignore`

## Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Troubleshooting

### Common Issues

1. **"User token can not be empty"**
   - Ensure the backend server is running on port 3001
   - Check that environment variables are properly set
   - Verify Stream Chat API keys are correct

2. **"Clerk authentication not working"**
   - Verify `VITE_CLERK_PUBLISHABLE_KEY` is correct
   - Ensure Clerk application is properly configured

3. **API server not responding**
   - Check if port 3001 is available
   - Verify environment variables are loaded
   - Check server console for errors

### Getting Help

- Check browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure both frontend and backend servers are running

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

Ensure your hosting platform supports:
- Node.js backend
- Environment variables
- WebSocket connections (for real-time chat)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
