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

  if (!isLoaded) return <div className="p-8">loading...</div>
  if (!client) return <div className="p-8">Connecting to chat...</div>

  return (
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
                onClick={() => alert('In a real app you would show user list here')}
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
  )
}

export default App