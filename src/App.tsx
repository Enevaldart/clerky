import './App.css'

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from '@clerk/clerk-react'

function App() {
  return (
    <>
    <div style={{
      padding: '40px',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '900px',
      margin: '0 auto'
    }}><h1>Clerk Authentication</h1>

    <SignedOut>
      <div style={{display: 'flex', gap: '20px', margin: '30px 0', justifyContent: 'center'}}>
        <SignUpButton mode='modal'>
          <button style={buttonStyle}>Sign In</button>
        </SignUpButton>
      </div>
    </SignedOut>

    <SignedIn>
        <div style={{ margin: '30px 0' }}>
          <p>You are signed in! 🎉</p>
          <UserButton />
        </div>
    </SignedIn>

    {/* Example protected content */}
    <SignedIn>
      <div style={{ 
        background: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '8px' 
      }}>
        <h3>Protected area</h3>
        <p>Only visible when you're logged in.</p>
      </div>
    </SignedIn>
    </div>
    </>
  )
}

const buttonStyle = {
  padding: '12px 24px',
  fontSize: '16px',
  backgroundColor: '#6366f1',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

export default App
