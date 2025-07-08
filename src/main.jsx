import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('DOMContentLoaded', () => {
  // Electron 环境下自动引入 taskAPI
  if (window.taskAPI) {
    // 可在此处做一些初始化
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
