import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './AuthContext.jsx'
import Onira from './DreamsComeTrue.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Onira />
    </AuthProvider>
  </React.StrictMode>,
)
