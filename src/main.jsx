import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Production: set baseURL so API calls go to backend (e.g. https://api.yourdomain.com)
const apiUrl = import.meta.env.VITE_API_URL
if (apiUrl) {
  axios.defaults.baseURL = apiUrl
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
