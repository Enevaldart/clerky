//app.tsx
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
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

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
      setIsLoadingUsers(true)
      try {
        const response = await fetch('http://localhost:3001/api/users')
        const data = await response.json()

        if (data.users) {
          // Filter out current user
          const filterUsers = data.users.filter((u: any) => u.id !== user.id)
          setOtherUsers(filteredUsers)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [client, user?.id])

  // Create 1-on-1 channel
  const createOneOnOneChannel = async (otherUser: { id: string; name: string }) => {
    if (!client || !user?.id) return

    try {
      const channelId = [user.id, otherUser.id].sort().join('-')
      const channel = client.channel('messaging', channelId, {
        members: [user.id, otherUser.id],
        name: otherUser.name,
      })

      await channel.watch()
      setActiveChannel(channel)
      setShowUserList(false)
    } catch (error) {
      console.error('Error creating 1-on-1 channel:', error)
    }
  }

  if (!isLoaded) {
    return  (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (isSignedIn && !client) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <div className="text-white text-lg">Connecting to chat...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-zinc-950 text-white">
        <div className="w-80 border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h1 className="text-xl font-bold">Chatty</h1>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>

          <SignedOut>
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-full space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                  <p className="text-zinc-400 text-sm">Sign in or create an account to start chatting</p>
                </div>
                <SignUpButton mode="modal">
                  <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            {client && (
              <Chat client={client}>
                <div className="flex-1 overflow-y-auto">
                  <ChannelList
                    filters={{ type: 'messaging', members: { $in: [user?.id || ''] } }}
                    onSelect={(channel) => setActiveChannel(channel)}
                    options={{
                      state: true,
                      presence: true,
                      limit: 10,
                    }}
                  />
                </div>

                <div className="p-4 border-t border-zinc-800">
                  <button
                    onClick={() => setShowUserList(true)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    + New 1-on-1 Chat
                  </button>
                </div>
              </Chat>
            )}
          </SignedIn>
        </div>

        <div className="flex-1 flex flex-col">
          <SignedOut>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Welcome to Chatty</h2>
                <p className="text-zinc-400">Sign in to start chatting with others</p>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            {client && (
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
                    <div className="text-center">
                      <p className="text-lg">Select a channel or start a new conversation</p>
                    </div>
                  </div>
                )}
              </Chat>
            )}
          </SignedIn>
        </div>
      </div>

      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 w-96 max-h-[32rem] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Start a conversation</h3>
            
            {isLoadingUsers ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-zinc-400">Loading users...</p>
              </div>
            ) : otherUsers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-zinc-400">No other users found</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {otherUsers.map((otherUser) => (
                  <button
                    key={otherUser.id}
                    onClick={() => createOneOnOneChannel(otherUser)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <img
                      src={otherUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`}
                      alt={otherUser.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="text-left">{otherUser.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setShowUserList(false)}
              className="w-full py-2 bg-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
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
