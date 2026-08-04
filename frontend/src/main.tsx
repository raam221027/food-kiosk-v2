import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // 1. Add this import
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

// 2. Create the client instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache menu data for 5 minutes
      refetchOnWindowFocus: false, // Prevents lag if the kiosk screen loses focus
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. Wrap your App component here */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
