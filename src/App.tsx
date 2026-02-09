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
import 'stream-chat-react/dist/css/v2/index.css'  //important for styling

// Stream API key from dashboard
const STREAM_API_KEY = import.meta.env.VITE_STREAM_CHAT_API_KEY

function App() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [activeChannel, setActiveChannel] = useState<any>(null)

  //A token generated for your Clerk user.id (dev only)
  const STREAM_USER_TOKEN = import.meta.env.VITE_STREAM_USER_TOKEN

  const client = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    tokenOrProvider: STREAM_USER_TOKEN,
    userData: {
      id: user?.id || '',
      name: user?.fullName || user?.emailAddresses[0]?.emailAddress || '',
      image: user?.imageUrl || '',
    },
  })

  // Auto-join/create the global "Everyone" group
  useEffect(() => {
    if (!client || !isSignedIn) return

    const globalChannel = client.channel('messaging', 'everyone', {
      name: 'Everyone Chat',
      // You can add all users later via dashboard or code
    })

    globalChannel.watch().then(() => {
      setActiveChannel(globalChannel)
    })
  }, [client, isSignedIn])

  if (!isLoaded) return <div className="p-8">loading...</div>
  if (!client) return <div className="p-8">Connecting to chat...</div>

  return (
  <div className="flex h-screen bg-zinc-950 text-white">
    {/* Sidebar*/}
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
        {/* Channel List (shows DMs + groups) */}
        <div className="flex-1 overflow-y-auto">
          <ChannelList
            filters={{ type: 'messaging' }}
            showChannelSearch
            onSelect={(channel) => setActiveChannel(channel)}
          />
        </div>

        {/* Quick "New DM" button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => alert('In a real app you would show user list here')}
            className="w-full py-2 bg-emerald-600 rounded-lg text-sm font-medium"
          >
            + New 1-on-1 Chat
          </button>
        </div>
      </SignedIn>
    </div>

    {/* Main Chat Area */}
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
          {activeChannel ? (
            <Chat client={client}>
              <Channel channel={activeChannel}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            </Chat>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              Select or create a channel
            </div>
          )}
      </SignedIn>

    </div>
  </div>
  )
}
 
export default App
