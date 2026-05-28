import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // <--- Confere se aqui tá sem o ponto também!
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)