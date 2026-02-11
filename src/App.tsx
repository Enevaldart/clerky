import './App.css'
import { useEffect, useState } from 'react'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from '@clerk/clerk-react'

import {
  Chat,
  ChannelList,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  useCreateChatClient,
} from 'stream-chat-react'
import type { Channel as ChannelType } from 'stream-chat'
import 'stream-chat-react/dist/css/v2/index.css'

const STREAM_API_KEY = import.meta.env.VITE_STREAM_CHAT_API_KEY as string

function App() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [activeChannel, setActiveChannel] = useState<ChannelType | null>(null)
  const [token, setToken] = useState<string>('')
  const [showUserList, setShowUserList] = useState(false)
  const [otherUsers, setOtherUsers] = useState<{ id: string; name: string; image?: string }[]>([])

  // Generate token from backend API
  useEffect(() => {
    if (!user?.id) return

    const generateToken = async () => {
      try {
        console.log('Generating token for user:', user.id)
        const response = await fetch('http://localhost:3001/api/stream-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        })
        
        const data = await response.json()
        console.log('Token response:', data)
        
        if (data.token) {
          setToken(data.token)
          console.log('Token set successfully')
        } else {
          console.error('Failed to generate token:', data.error)
        }
      } catch (error) {
        console.error('Error fetching token:', error)
      }
    }
    
    generateToken()
  }, [user?.id])

  const client = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    tokenOrProvider: token,
    userData: {
      id: user?.id || '',
      name: user?.fullName || user?.emailAddresses[0]?.emailAddress || '',
      image: user?.imageUrl || '',
    },
  })

  useEffect(() => {
    if (!client || !isSignedIn) return

    const globalChannel = client.channel('messaging', 'everyone', {
      name: 'Everyone Chat',
    })

    globalChannel.watch().then(() => {
      setActiveChannel(globalChannel)
    })
  }, [client, isSignedIn])

  // Fetch other Clerk users when client is ready
  useEffect(() => {
    if (!client) return

    const fetchUsers = async () => {
      try {
        // For now, we'll create a simple approach with mock users
        // In a real app, you'd create a backend endpoint to fetch Clerk users
        // or use Stream Chat's user query functionality
        
        // This is a placeholder - in production you'd:
        // 1. Create a backend endpoint that queries Clerk users
        // 2. Or use Stream Chat's built-in user management
        const mockUsers = [
          { 
            id: 'demo-user-1', 
            name: 'Demo User 1', 
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo1' 
          },
          { 
            id: 'demo-user-2', 
            name: 'Demo User 2', 
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo2' 
          },
        ].filter(mockUser => mockUser.id !== user?.id)
        
        setOtherUsers(mockUsers)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    fetchUsers()
  }, [client, user?.id])

  // Create 1-on-1 channel
  const createOneOnOneChannel = async (otherUser: { id: string; name: string }) => {
    if (!client || !user?.id) return

    try {
      const channelId = [user.id, otherUser.id].sort().join('-')
      const channel = client.channel('messaging', channelId)

      await channel.watch()
      setActiveChannel(channel)
      setShowUserList(false)
    } catch (error) {
      console.error('Error creating 1-on-1 channel:', error)
    }
  }

  if (!isLoaded) return <div className="p-8">loading...</div>
  if (!client) return <div className="p-8">Connecting to chat...</div>

  return (
    <>
      <div className="flex h-screen bg-zinc-950 text-white">
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-xl font-bold">Chatty</h1>
          <UserButton />
        </div>

        <SignedOut>
          <div className="p-4 space-y-4">
            <SignUpButton mode="modal">
              <button className="w-full py-3 bg-indigo-600 rounded-lg font-medium">Sign Up</button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="w-full py-3 bg-zinc-800 rounded-lg font-medium">Sign In</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <Chat client={client}>
            <div className="flex-1 overflow-y-auto">
              <ChannelList
                filters={{ type: 'messaging' }}
                onSelect={(channel) => setActiveChannel(channel)}
              />
            </div>

            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowUserList(true)}
                className="w-full py-2 bg-emerald-600 rounded-lg text-sm font-medium"
              >
                + New 1-on-1 Chat
              </button>
            </div>
          </Chat>
        </SignedIn>
      </div>

      <div className="flex-1 flex flex-col">
        <SignedOut>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Welcome to Chatty</h2>
              <p className="text-zinc-400">Sign in to start chatting</p>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <Chat client={client}>
            {activeChannel ? (
              <Channel channel={activeChannel}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                Select or create a channel
              </div>
            )}
          </Chat>
        </SignedIn>
      </div>
    </div>

      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Start a conversation</h3>
            <div className="space-y-2">
              {otherUsers.map((otherUser) => (
                <button
                  key={otherUser.id}
                  onClick={() => createOneOnOneChannel(otherUser)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <img
                    src={otherUser.image}
                    alt={otherUser.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-left">{otherUser.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowUserList(false)}
              className="mt-4 w-full py-2 bg-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
